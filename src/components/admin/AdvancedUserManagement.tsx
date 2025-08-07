// 🏢 Advanced User Management Component
// Complete UI for multi-tenant user management

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Skeleton,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  VpnKey as KeyIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdvancedUserManagement: React.FC = () => {
  const theme = useTheme();
  const { state } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for different entities
  const [organization, setOrganization] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states
  const [userForm, setUserForm] = useState({
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
    salary: ''
  });

  const [roleForm, setRoleForm] = useState({
    name: '',
    displayName: '',
    description: '',
    level: 1,
    permissions: {}
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    parentDepartmentId: '',
    managerId: '',
    monthlyBudget: '',
    vehicleLimit: ''
  });

  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    teamLeadId: ''
  });

  useEffect(() => {
    loadData();
  }, [currentTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load organization info
      const orgResponse = await fetch('/api/advanced-users/organization', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

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
  };

  const loadOrganizationStats = async () => {
    const response = await fetch('/api/advanced-users/organization/stats', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setStats(data.stats);
    }
  };

  const loadUsers = async () => {
    const response = await fetch('/api/advanced-users/users', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setUsers(data.users);
    }
  };

  const loadRoles = async () => {
    const response = await fetch('/api/advanced-users/roles', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setRoles(data.roles);
    }
  };

  const loadDepartments = async () => {
    const response = await fetch('/api/advanced-users/departments', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setDepartments(data.departments);
    }
  };

  const loadTeams = async () => {
    const response = await fetch('/api/advanced-users/teams', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setTeams(data.teams);
    }
  };

  const loadActivityLog = async () => {
    const response = await fetch('/api/advanced-users/activity-log?limit=50', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setActivityLog(data.activityLog);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/advanced-users/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(userForm)
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
      const response = await fetch('/api/advanced-users/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(roleForm)
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
      const response = await fetch('/api/advanced-users/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(departmentForm)
      });

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
      const response = await fetch('/api/advanced-users/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(teamForm)
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

  const handleDeactivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/advanced-users/users/${userId}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

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
      salary: ''
    });
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      displayName: '',
      description: '',
      level: 1,
      permissions: {}
    });
  };

  const resetDepartmentForm = () => {
    setDepartmentForm({
      name: '',
      description: '',
      parentDepartmentId: '',
      managerId: '',
      monthlyBudget: '',
      vehicleLimit: ''
    });
  };

  const resetTeamForm = () => {
    setTeamForm({
      name: '',
      description: '',
      teamLeadId: ''
    });
  };

  const getAuthToken = () => {
    return state.token || localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
  };

  const getRoleLevel = (level: number) => {
    const levels = {
      10: 'Super Admin',
      9: 'Admin',
      7: 'Manager',
      5: 'Employee',
      4: 'Sales Rep',
      3: 'Mechanic',
      1: 'Viewer'
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
              fontWeight: 500
            }
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
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  Informácie o organizácii
                </Typography>
                
                {organization && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      {organization.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {organization.slug}
                    </Typography>
                    
                    <Chip
                      label={organization.subscriptionPlan.toUpperCase()}
                      color="primary"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Email:</strong> {organization.email || 'Nie je nastavený'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Telefón:</strong> {organization.phone || 'Nie je nastavený'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Max. používateľov:</strong> {organization.maxUsers}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Max. vozidiel:</strong> {organization.maxVehicles}
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
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AnalyticsIcon />
                  Štatistiky
                </Typography>
                
                {stats && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" color="primary">
                          {stats.totalUsers || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Celkom používateľov
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" color="success.main">
                          {stats.activeUsers || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Aktívnych
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" color="info.main">
                          {stats.totalDepartments || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Oddelení
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" color="warning.main">
                          {stats.totalTeams || 0}
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
          <Typography variant="h6">
            Používatelia ({users.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setUserDialogOpen(true)}
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
              {users.map((user) => (
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
                            : user.username
                          }
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
                      ? format(new Date(user.lastLoginAt), 'dd.MM.yyyy HH:mm', { locale: sk })
                      : 'Nikdy'
                    }
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Zobraziť">
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Upraviť">
                      <IconButton size="small">
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
          <Typography variant="h6">
            Role ({roles.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setRoleDialogOpen(true)}
          >
            Pridať rolu
          </Button>
        </Box>

        <Grid container spacing={2}>
          {roles.map((role) => (
            <Grid item xs={12} md={6} lg={4} key={role.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
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

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <Typography variant="h6">
            Oddelenia ({departments.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDepartmentDialogOpen(true)}
          >
            Pridať oddelenie
          </Button>
        </Box>

        <Grid container spacing={2}>
          {departments.map((department) => (
            <Grid item xs={12} md={6} key={department.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {department.name}
                  </Typography>
                  
                  {department.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {department.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
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
          <Typography variant="h6">
            Tímy ({teams.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setTeamDialogOpen(true)}
          >
            Pridať tím
          </Button>
        </Box>

        <Grid container spacing={2}>
          {teams.map((team) => (
            <Grid item xs={12} md={6} key={team.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {team.name}
                  </Typography>
                  
                  {team.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {team.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              {activityLog.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss', { locale: sk })}
                  </TableCell>
                  <TableCell>{log.userId}</TableCell>
                  <TableCell>
                    <Chip size="small" label={log.action} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {log.resourceType && (
                      <Chip size="small" label={log.resourceType} color="info" variant="outlined" />
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
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Pridať používateľa</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Používateľské meno"
                value={userForm.username}
                onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Meno"
                value={userForm.firstName}
                onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={userForm.lastName}
                onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heslo"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefón"
                value={userForm.phone}
                onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rola</InputLabel>
                <Select
                  value={userForm.roleId}
                  onChange={(e) => setUserForm(prev => ({ ...prev, roleId: e.target.value }))}
                  label="Rola"
                >
                  {roles.map((role) => (
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
                  onChange={(e) => setUserForm(prev => ({ ...prev, departmentId: e.target.value }))}
                  label="Oddelenie"
                >
                  <MenuItem value="">Žiadne</MenuItem>
                  {departments.map((dept) => (
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
          <Button onClick={() => setUserDialogOpen(false)}>
            Zrušiť
          </Button>
          <Button variant="contained" onClick={handleCreateUser}>
            Vytvoriť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pridať rolu</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov role"
                value={userForm.username}
                onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Zobrazovaný názov"
                value={roleForm.displayName}
                onChange={(e) => setRoleForm(prev => ({ ...prev, displayName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Popis"
                multiline
                rows={3}
                value={roleForm.description}
                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Úroveň (1-10)"
                type="number"
                value={roleForm.level}
                onChange={(e) => setRoleForm(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>
            Zrušiť
          </Button>
          <Button variant="contained" onClick={handleCreateRole}>
            Vytvoriť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={departmentDialogOpen} onClose={() => setDepartmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pridať oddelenie</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov oddelenia"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Popis"
                multiline
                rows={3}
                value={departmentForm.description}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mesačný budget (€)"
                type="number"
                value={departmentForm.monthlyBudget}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, monthlyBudget: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Limit vozidiel"
                type="number"
                value={departmentForm.vehicleLimit}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, vehicleLimit: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentDialogOpen(false)}>
            Zrušiť
          </Button>
          <Button variant="contained" onClick={handleCreateDepartment}>
            Vytvoriť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Dialog */}
      <Dialog open={teamDialogOpen} onClose={() => setTeamDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pridať tím</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov tímu"
                value={teamForm.name}
                onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Popis"
                multiline
                rows={3}
                value={teamForm.description}
                onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Vedúci tímu</InputLabel>
                <Select
                  value={teamForm.teamLeadId}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, teamLeadId: e.target.value }))}
                  label="Vedúci tímu"
                >
                  <MenuItem value="">Žiadny</MenuItem>
                  {users.filter(u => u.isActive).map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.username
                      }
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialogOpen(false)}>
            Zrušiť
          </Button>
          <Button variant="contained" onClick={handleCreateTeam}>
            Vytvoriť
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedUserManagement;
