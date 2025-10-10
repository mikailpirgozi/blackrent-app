// 🏢 Advanced User Management Component
// Complete UI for multi-tenant user management

import {
  Add as AddIcon,
  // VpnKey as KeyIcon,
  Analytics as AnalyticsIcon,
  Block as BlockIcon,
  Business as BusinessIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  // Settings as SettingsIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  // List,
  // ListItem,
  // ListItemAvatar,
  // ListItemText,
  // ListItemSecondaryAction,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  // useTheme,
  // alpha,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useCallback, useEffect, useState } from 'react';

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`advanced-user-tabpanel-${index}`}
      aria-labelledby={`advanced-user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      setError('Chyba pri vytváraní tímu');
    }
  };

  const handleViewUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      alert(
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
    } catch (error) {
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
    } catch (error) {
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

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  if (loading && currentTab === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Pokročilé správa používateľov
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Multi-tenant user management s pokročilými rolami a oprávneniami
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: 120,
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
        >
          <Tab icon={<BusinessIcon />} label="Organizácia" />
          <Tab icon={<GroupIcon />} label="Používatelia" />
          <Tab icon={<SecurityIcon />} label="Role" />
          <Tab icon={<BusinessIcon />} label="Oddelenia" />
          <Tab icon={<GroupIcon />} label="Tímy" />
          <Tab icon={<TimelineIcon />} label="Audit Log" />
        </Tabs>
      </Card>

      {/* Tab Panels */}

      {/* Organization Overview */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          {/* Organization Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <BusinessIcon />
                  Informácie o organizácii
                </Typography>

                {organization && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      {String(organization.name || 'Unknown')}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {String(organization.slug || 'Unknown')}
                    </Typography>

                    <Chip
                      label={String(
                        organization.subscriptionPlan || 'Unknown'
                      ).toUpperCase()}
                      color="primary"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Email:</strong>{' '}
                        {String(organization.email || 'Nie je nastavený')}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Telefón:</strong>{' '}
                        {String(organization.phone || 'Nie je nastavený')}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Max. používateľov:</strong>{' '}
                        {String(organization.maxUsers || 'Unknown')}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Max. vozidiel:</strong>{' '}
                        {String(organization.maxVehicles || 'Unknown')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <AnalyticsIcon />
                  Štatistiky
                </Typography>

                {stats && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" color="primary">
                          {String(stats.totalUsers || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Celkom používateľov
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" color="success.main">
                          {String(stats.activeUsers || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Aktívnych
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" color="info.main">
                          {String(stats.totalDepartments || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Oddelení
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" color="warning.main">
                          {String(stats.totalTeams || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tímov
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Users Management */}
      <TabPanel value={currentTab} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Používatelia ({users.length})</Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => {
              setUserDialogOpen(true);
              loadRoles(); // Načítaj role pri otvorení dialógu
            }}
          >
            Pridať používateľa
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Používateľ</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rola</TableCell>
                <TableCell>Oddelenie</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Posledné prihlásenie</TableCell>
                <TableCell>Akcie</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {user.firstName?.[0] || user.username[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.jobTitle || user.username}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={user.roleName || 'N/A'}
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{user.departmentName || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={user.isActive ? 'Aktívny' : 'Neaktívny'}
                      color={getStatusColor(user.isActive)}
                    />
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt
                      ? format(new Date(user.lastLoginAt), 'dd.MM.yyyy HH:mm', {
                          locale: sk,
                        })
                      : 'Nikdy'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Zobraziť">
                      <IconButton
                        size="small"
                        onClick={() => handleViewUser(user.id)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Upraviť">
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user.id)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {user.isActive && (
                      <Tooltip title="Deaktivovať">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeactivateUser(user.id)}
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Roles Management */}
      <TabPanel value={currentTab} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Role ({roles.length})</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setRoleDialogOpen(true)}
          >
            Pridať rolu
          </Button>
        </Box>

        <Grid container spacing={2}>
          {roles.map(role => (
            <Grid item xs={12} md={6} lg={4} key={role.id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {role.displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {role.name}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={getRoleLevel(role.level)}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" sx={{ mb: 2, minHeight: 40 }}>
                    {role.description || 'Bez popisu'}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {role.isSystem && (
                        <Chip size="small" label="Systémová" color="info" />
                      )}
                      {!role.isActive && (
                        <Chip size="small" label="Neaktívna" color="error" />
                      )}
                    </Box>

                    {!role.isSystem && (
                      <Box>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Departments Management */}
      <TabPanel value={currentTab} index={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Oddelenia ({departments.length})</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDepartmentDialogOpen(true)}
          >
            Pridať oddelenie
          </Button>
        </Box>

        <Grid container spacing={2}>
          {departments.map(department => (
            <Grid item xs={12} md={6} key={department.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {department.name}
                  </Typography>

                  {department.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {department.description}
                    </Typography>
                  )}

                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}
                  >
                    {department.monthlyBudget && (
                      <Chip
                        size="small"
                        label={`Budget: ${department.monthlyBudget}€`}
                        color="success"
                        variant="outlined"
                      />
                    )}
                    {department.vehicleLimit && (
                      <Chip
                        size="small"
                        label={`Vozidlá: ${department.vehicleLimit}`}
                        color="info"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Teams Management */}
      <TabPanel value={currentTab} index={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Tímy ({teams.length})</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setTeamDialogOpen(true)}
          >
            Pridať tím
          </Button>
        </Box>

        <Grid container spacing={2}>
          {teams.map(team => (
            <Grid item xs={12} md={6} key={team.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {team.name}
                  </Typography>

                  {team.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {team.description}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Chip
                      size="small"
                      label={team.isActive ? 'Aktívny' : 'Neaktívny'}
                      color={team.isActive ? 'success' : 'error'}
                    />

                    <Box>
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Activity Log */}
      <TabPanel value={currentTab} index={5}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Audit Log ({activityLog.length})
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Čas</TableCell>
                <TableCell>Používateľ</TableCell>
                <TableCell>Akcia</TableCell>
                <TableCell>Zdroj</TableCell>
                <TableCell>IP adresa</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activityLog.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss', {
                      locale: sk,
                    })}
                  </TableCell>
                  <TableCell>{log.userId}</TableCell>
                  <TableCell>
                    <Chip size="small" label={log.action} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {log.resourceType && (
                      <Chip
                        size="small"
                        label={log.resourceType}
                        color="info"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>{log.ipAddress || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={log.success ? 'Úspech' : 'Chyba'}
                      color={log.success ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* User Dialog */}
      <Dialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Pridať používateľa</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Používateľské meno"
                value={userForm.username}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, username: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, email: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Meno"
                value={userForm.firstName}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, firstName: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={userForm.lastName}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, lastName: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heslo"
                type="password"
                value={userForm.password}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, password: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefón"
                value={userForm.phone}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, phone: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rola</InputLabel>
                <Select
                  value={userForm.roleId}
                  onChange={e =>
                    setUserForm(prev => ({ ...prev, roleId: e.target.value }))
                  }
                  label="Rola"
                >
                  {roles.map(role => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Oddelenie</InputLabel>
                <Select
                  value={userForm.departmentId}
                  onChange={e =>
                    setUserForm(prev => ({
                      ...prev,
                      departmentId: e.target.value,
                    }))
                  }
                  label="Oddelenie"
                >
                  <MenuItem value="">Žiadne</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Zrušiť</Button>
          <Button variant="contained" onClick={handleCreateUser}>
            Vytvoriť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Pridať rolu</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov role"
                value={userForm.username}
                onChange={e =>
                  setRoleForm(prev => ({ ...prev, name: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Zobrazovaný názov"
                value={roleForm.displayName}
                onChange={e =>
                  setRoleForm(prev => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Popis"
                multiline
                rows={3}
                value={roleForm.description}
                onChange={e =>
                  setRoleForm(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Úroveň (1-10)"
                type="number"
                value={roleForm.level}
                onChange={e =>
                  setRoleForm(prev => ({
                    ...prev,
                    level: parseInt(e.target.value) || 1,
                  }))
                }
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Zrušiť</Button>
          <Button variant="contained" onClick={handleCreateRole}>
            Vytvoriť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Dialog */}
      <Dialog
        open={departmentDialogOpen}
        onClose={() => setDepartmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Pridať oddelenie</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov oddelenia"
                value={departmentForm.name}
                onChange={e =>
                  setDepartmentForm(prev => ({ ...prev, name: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Popis"
                multiline
                rows={3}
                value={departmentForm.description}
                onChange={e =>
                  setDepartmentForm(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mesačný budget (€)"
                type="number"
                value={departmentForm.monthlyBudget}
                onChange={e =>
                  setDepartmentForm(prev => ({
                    ...prev,
                    monthlyBudget: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Limit vozidiel"
                type="number"
                value={departmentForm.vehicleLimit}
                onChange={e =>
                  setDepartmentForm(prev => ({
                    ...prev,
                    vehicleLimit: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentDialogOpen(false)}>Zrušiť</Button>
          <Button variant="contained" onClick={handleCreateDepartment}>
            Vytvoriť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Dialog */}
      <Dialog
        open={teamDialogOpen}
        onClose={() => setTeamDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Pridať tím</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov tímu"
                value={teamForm.name}
                onChange={e =>
                  setTeamForm(prev => ({ ...prev, name: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Popis"
                multiline
                rows={3}
                value={teamForm.description}
                onChange={e =>
                  setTeamForm(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Vedúci tímu</InputLabel>
                <Select
                  value={teamForm.teamLeadId}
                  onChange={e =>
                    setTeamForm(prev => ({
                      ...prev,
                      teamLeadId: e.target.value,
                    }))
                  }
                  label="Vedúci tímu"
                >
                  <MenuItem value="">Žiadny</MenuItem>
                  {users
                    .filter(u => u.isActive)
                    .map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialogOpen(false)}>Zrušiť</Button>
          <Button variant="contained" onClick={handleCreateTeam}>
            Vytvoriť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editModalOpen}
        onClose={handleCancelEdit}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upraviť používateľa</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Meno"
                value={editForm.firstName}
                onChange={e =>
                  setEditForm({ ...editForm, firstName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={editForm.lastName}
                onChange={e =>
                  setEditForm({ ...editForm, lastName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editForm.email}
                onChange={e =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefón"
                value={editForm.phone}
                onChange={e =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pozícia"
                value={editForm.jobTitle}
                onChange={e =>
                  setEditForm({ ...editForm, jobTitle: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rola</InputLabel>
                <Select
                  value={editForm.roleId}
                  onChange={e =>
                    setEditForm({ ...editForm, roleId: e.target.value })
                  }
                  label="Rola"
                >
                  {roles.map(role => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Oddelenie</InputLabel>
                <Select
                  value={editForm.departmentId}
                  onChange={e =>
                    setEditForm({ ...editForm, departmentId: e.target.value })
                  }
                  label="Oddelenie"
                >
                  <MenuItem value="">Žiadne</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Permissions Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="h6"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <SecurityIcon />
                Oprávnenia pre firmy
              </Typography>

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
                  <Accordion key={company.id} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <BusinessIcon />
                        <Typography>{company.name}</Typography>
                        {userCompanyAccess && (
                          <Chip
                            size="small"
                            label="Má prístup"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1}>
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
                          <Grid item xs={12} key={resource}>
                            <Typography
                              variant="body2"
                              sx={{ mb: 1, fontWeight: 500 }}
                            >
                              {label}
                            </Typography>
                            <Box
                              sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}
                            >
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={
                                      permissions[resource]?.read || false
                                    }
                                    onChange={e => {
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
                                            .permissions;
                                        if (!permissions[resource]) {
                                          permissions[resource] = {};
                                        }
                                        (
                                          permissions[resource] as {
                                            read?: boolean;
                                          }
                                        ).read = e.target.checked;
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
                                          permissionsObj[resource] = {};
                                        }
                                        permissionsObj[resource].read =
                                          e.target.checked;
                                        newPermissions.push(newPerm);
                                      }

                                      setUserPermissions(newPermissions);
                                    }}
                                  />
                                }
                                label="Čítanie"
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={
                                      permissions[resource]?.write || false
                                    }
                                    onChange={e => {
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
                                            .permissions;
                                        if (!permissions[resource]) {
                                          permissions[resource] = {};
                                        }
                                        (
                                          permissions[resource] as {
                                            write?: boolean;
                                          }
                                        ).write = e.target.checked;
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
                                          permissionsObj[resource] = {};
                                        }
                                        permissionsObj[resource].write =
                                          e.target.checked;
                                        newPermissions.push(newPerm);
                                      }

                                      setUserPermissions(newPermissions);
                                    }}
                                  />
                                }
                                label="Zápis"
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={
                                      permissions[resource]?.delete || false
                                    }
                                    onChange={e => {
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
                                            .permissions;
                                        if (!permissions[resource]) {
                                          permissions[resource] = {};
                                        }
                                        (
                                          permissions[resource] as {
                                            delete?: boolean;
                                          }
                                        ).delete = e.target.checked;
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
                                          permissionsObj[resource] = {};
                                        }
                                        permissionsObj[resource].delete =
                                          e.target.checked;
                                        newPermissions.push(newPerm);
                                      }

                                      setUserPermissions(newPermissions);
                                    }}
                                  />
                                }
                                label="Mazanie"
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Zrušiť</Button>
          <Button variant="contained" onClick={handleSaveEditUser}>
            Uložiť
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedUserManagement;
