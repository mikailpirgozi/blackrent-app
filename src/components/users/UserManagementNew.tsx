import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  useMediaQuery,
  useTheme,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Collapse,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  Build as BuildIcon,
  Engineering as EngineeringIcon,
  BusinessCenter as BusinessIcon,
  Business as CompanyIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  VpnKey as PermissionIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { usePermissions, getUserRoleDisplayName } from '../../hooks/usePermissions';
import { PermissionGuard, RoleGuard } from '../common/PermissionGuard';
import { User, UserRole, Company } from '../../types';
import { apiService } from '../../services/api';

interface UserFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  companyId?: string;
  employeeNumber?: string;
  hireDate?: Date;
  isActive: boolean;
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#f44336',
  employee: '#2196f3',
  temp_worker: '#ff9800',
  mechanic: '#4caf50',
  sales_rep: '#9c27b0',
  company_owner: '#795548'
};

const ROLE_BACKGROUNDS: Record<UserRole, string> = {
  admin: '#ffebee',
  employee: '#e3f2fd',
  temp_worker: '#fff3e0',
  mechanic: '#e8f5e8',
  sales_rep: '#f3e5f5',
  company_owner: '#efebe9'
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Úplné práva na všetky funkcie aplikácie',
  employee: 'Základné operácie s vozidlami, prenájmami, zákazníkmi',
  temp_worker: 'Obmedzené práva, hlavne čítanie a základné operácie',
  mechanic: 'Špecializované práva na údržbu a priradené vozidlá',
  sales_rep: 'Obchodné operácie s limitmi na ceny',
  company_owner: 'Prístup len k vlastným vozidlám a súvisiacim dátam'
};

export default function UserManagementNew() {
  const { state: authState } = useAuth();
  const { state: appState } = useApp();
  const permissions = usePermissions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'employee',
    companyId: '',
    employeeNumber: '',
    hireDate: undefined,
    isActive: true
  });

  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showPasswords, setShowPasswords] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const inactive = users.filter(u => !u.isActive).length;
    
    const roleStats = Object.keys(ROLE_COLORS).reduce((acc, role) => {
      acc[role as UserRole] = users.filter(u => u.role === role).length;
      return acc;
    }, {} as Record<UserRole, number>);
    
    const recentUsers = users.filter(user => {
      const createdDate = new Date(user.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return createdDate >= sevenDaysAgo;
    }).length;
    
    return { total, active, inactive, roleStats, recentUsers };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    console.log('🔍 Filtering users...', { 
      totalUsers: users.length, 
      searchQuery, 
      filterRole, 
      filterCompany, 
      filterActive 
    });
    
    const filtered = users.filter((user) => {
      const matchesSearch = !searchQuery || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = !filterRole || user.role === filterRole;
      const matchesCompany = !filterCompany || user.companyId === filterCompany;
      const matchesActive = filterActive === '' || user.isActive === filterActive;
      
      return matchesSearch && matchesRole && matchesCompany && matchesActive;
    });
    
    console.log('🔍 Filtered users count:', filtered.length);
    return filtered;
  }, [users, searchQuery, filterRole, filterCompany, filterActive]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const paginated = filteredUsers.slice(startIndex, startIndex + rowsPerPage);
    console.log('📄 Paginated users:', { 
      page, 
      rowsPerPage, 
      startIndex, 
      filteredCount: filteredUsers.length,
      paginatedCount: paginated.length 
    });
    return paginated;
  }, [filteredUsers, page, rowsPerPage]);

  // Fetch data
  useEffect(() => {
    console.log('🏁 UserManagement mounted, fetching initial data...');
    fetchUsers();
    fetchCompanies();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('👥 Fetching users...');
      const response = await apiService.getUsers();
      console.log('👥 Users response:', response);
      console.log('👥 Users count:', response?.length);
      setUsers(response);
      setError(null); // clear any previous errors
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Chyba pri načítavaní používateľov');
      setUsers([]); // fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      console.log('🏢 Fetching companies...');
      const response = await apiService.getCompanies();
      console.log('🏢 Companies response:', response);
      setCompanies(response);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]); // fallback to empty array
    }
  };

  // Dialog handlers
  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        password: '',
        role: user.role,
        companyId: user.companyId || '',
        employeeNumber: user.employeeNumber || '',
        hireDate: user.hireDate,
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'employee',
        companyId: '',
        employeeNumber: '',
        hireDate: undefined,
        isActive: true
      });
    }
    setDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!formData.username || !formData.email || (!editingUser && !formData.password)) {
        setError('Vyplňte všetky povinné polia');
        return;
      }

      if (!editingUser && formData.password.length < 6) {
        setError('Heslo musí mať minimálne 6 znakov');
        return;
      }

      const userData: Partial<User> = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        companyId: formData.companyId || undefined,
        employeeNumber: formData.employeeNumber || undefined,
        hireDate: formData.hireDate,
        isActive: formData.isActive
      };

      if (formData.password) {
        (userData as any).password = formData.password;
      }

      if (editingUser) {
        await apiService.updateUser(editingUser.id, userData);
        setSuccess('Používateľ úspešne aktualizovaný');
      } else {
        await apiService.createUser(userData as User);
        setSuccess('Používateľ úspešne vytvorený');
      }

      console.log('👤 User saved, refreshing list...');
      await fetchUsers(); // wait for users to be fetched
      console.log('👤 Users refreshed');
      
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);

    } catch (error: any) {
      console.error('Error saving user:', error);
      setError(error.response?.data?.error || 'Chyba pri ukladaní používateľa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Naozaj chcete zmazať tohto používateľa?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteUser(userId);
      setSuccess('Používateľ úspešne zmazaný');
      console.log('👤 User deleted, refreshing list...');
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.error || 'Chyba pri mazaní používateľa');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await apiService.updateUser(user.id, { ...user, isActive: !user.isActive });
      console.log('👤 User status toggled, refreshing list...');
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterRole('');
    setFilterCompany('');
    setFilterActive('');
    setPage(0);
  };

  const getRoleChip = (role: UserRole) => (
    <Chip
      label={getUserRoleDisplayName(role)}
      size="small"
      sx={{
        bgcolor: ROLE_COLORS[role],
        color: 'white',
        fontWeight: 600,
        fontSize: '0.75rem'
      }}
    />
  );

  const getCompanyName = (companyId?: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Nezadané';
  };

  return (
    <RoleGuard allowedRoles={['admin']} showAccessDeniedMessage>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: '#1976d2',
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}>
            👥 Správa používateľov
          </Typography>
          
          <PermissionGuard resource="users" action="create">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: '#1976d2',
                px: 3,
                py: 1,
                borderRadius: 2
              }}
            >
              Nový používateľ
            </Button>
          </PermissionGuard>
        </Box>

        {/* Success/Error Messages */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Celkom používateľov
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#e8f5e8' }}>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {stats.active}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aktívni
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ffebee' }}>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {stats.inactive}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Neaktívni
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {stats.recentUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Noví (7 dní)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Role Statistics */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              📊 Rozdelenie podľa rolí
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(stats.roleStats).map(([role, count]) => (
                <Grid item xs={6} sm={4} md={2} key={role}>
                  <Box sx={{ textAlign: 'center' }}>
                    {getRoleChip(role as UserRole)}
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {count}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Hľadať používateľov..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
              
              <Button
                variant="outlined"
                startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtre
              </Button>
              
              {(searchQuery || filterRole || filterCompany || filterActive !== '') && (
                <Button
                  variant="text"
                  onClick={clearFilters}
                  color="error"
                >
                  Vymazať filtre
                </Button>
              )}
            </Box>

            <Collapse in={showFilters}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Rola</InputLabel>
                    <Select
                      value={filterRole}
                      label="Rola"
                      onChange={(e) => setFilterRole(e.target.value as UserRole)}
                    >
                      <MenuItem value="">Všetky role</MenuItem>
                      {Object.keys(ROLE_COLORS).map((role) => (
                        <MenuItem key={role} value={role}>
                          {getUserRoleDisplayName(role as UserRole)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Firma</InputLabel>
                    <Select
                      value={filterCompany}
                      label="Firma"
                      onChange={(e) => setFilterCompany(e.target.value)}
                    >
                      <MenuItem value="">Všetky firmy</MenuItem>
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterActive}
                      label="Status"
                      onChange={(e) => setFilterActive(e.target.value === '' ? '' : e.target.value === 'true')}
                    >
                      <MenuItem value="">Všetci</MenuItem>
                      <MenuItem value="true">Aktívni</MenuItem>
                      <MenuItem value="false">Neaktívni</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Používateľ</TableCell>
                    <TableCell>Rola</TableCell>
                    <TableCell>Firma</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Vytvorený</TableCell>
                    <TableCell align="center">Akcie</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">
                          Žiadni používatelia
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {user.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                            {(user.firstName || user.lastName) && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {user.firstName} {user.lastName}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          {getRoleChip(user.role)}
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {getCompanyName(user.companyId)}
                          </Typography>
                          {user.employeeNumber && (
                            <Typography variant="caption" color="text.secondary">
                              Číslo: {user.employeeNumber}
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            icon={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
                            label={user.isActive ? 'Aktívny' : 'Neaktívny'}
                            color={user.isActive ? 'success' : 'error'}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(user.createdAt), 'dd.MM.yyyy', { locale: sk })}
                          </Typography>
                          {user.lastLogin && (
                            <Typography variant="caption" color="text.secondary">
                              Posledne: {format(new Date(user.lastLogin), 'dd.MM.yyyy HH:mm', { locale: sk })}
                            </Typography>
                          )}
                        </TableCell>
                        
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <PermissionGuard resource="users" action="update">
                              <Tooltip title="Upraviť používateľa">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(user)}
                                  sx={{ bgcolor: '#2196f3', color: 'white' }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </PermissionGuard>
                            
                            <Tooltip title={user.isActive ? 'Deaktivovať' : 'Aktivovať'}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleActive(user)}
                                sx={{ 
                                  bgcolor: user.isActive ? '#ff9800' : '#4caf50', 
                                  color: 'white' 
                                }}
                              >
                                {user.isActive ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            
                            <PermissionGuard resource="users" action="delete">
                              <Tooltip title="Zmazať používateľa">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(user.id)}
                                  sx={{ bgcolor: '#f44336', color: 'white' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </PermissionGuard>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={filteredUsers.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Riadkov na stránku:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} z ${count !== -1 ? count : `viac ako ${to}`}`
              }
            />
          </CardContent>
        </Card>

        {/* User Form Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingUser ? `✏️ Upraviť používateľa` : `➕ Nový používateľ`}
          </DialogTitle>
          
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Používateľské meno *"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Krstné meno"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Priezvisko"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={editingUser ? "Nové heslo (voliteľné)" : "Heslo *"}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  helperText="Minimálne 6 znakov"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Rola *</InputLabel>
                  <Select
                    value={formData.role}
                    label="Rola *"
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  >
                    {Object.keys(ROLE_COLORS).map((role) => (
                      <MenuItem key={role} value={role}>
                        <Box>
                          <Typography>{getUserRoleDisplayName(role as UserRole)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ROLE_DESCRIPTIONS[role as UserRole]}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {(formData.role === 'company_owner' || formData.role === 'mechanic') && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Firma</InputLabel>
                    <Select
                      value={formData.companyId || ''}
                      label="Firma"
                      onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                    >
                      <MenuItem value="">Nezadané</MenuItem>
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Číslo zamestnanca"
                  value={formData.employeeNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeNumber: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  }
                  label="Aktívny používateľ"
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog}>
              Zrušiť
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Ukladá sa...' : (editingUser ? 'Aktualizovať' : 'Vytvoriť')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </RoleGuard>
  );
} 