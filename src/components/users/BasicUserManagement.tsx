import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  Alert,
  Skeleton,
  useTheme,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const BasicUserManagement: React.FC = () => {
  const theme = useTheme();
  const { state } = useAuth();

  // Helper function to safely format dates
  const formatDate = (dateValue: string | null | undefined, formatString: string, fallback: string = 'Neznámy') => {
    if (!dateValue) return fallback;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return fallback;
      return format(date, formatString, { locale: sk });
    } catch (error) {
      return fallback;
    }
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });

  // API Base URL helper
  const getApiBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return 'https://blackrent-app-production-4d6f.up.railway.app/api';
    }
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:3001/api`;
  };

  const getAuthToken = () => {
    return state.token || localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('👥 Loaded users:', data);
        
        // Transform data to match our interface
        const transformedUsers = (data.data || data.users || []).map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.first_name || user.firstName,
          lastName: user.last_name || user.lastName,
          isActive: user.is_active !== false, // default to true if undefined
          lastLogin: user.last_login || user.lastLogin,
          createdAt: user.created_at || user.createdAt
        }));
        
        setUsers(transformedUsers);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Chyba pri načítavaní používateľov');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Chyba pri načítavaní používateľov');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/users`, {
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
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Chyba pri vytváraní používateľa');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Chyba pri vytváraní používateľa');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      password: '', // Never pre-fill password
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const updateData: any = { ...userForm };
      // Don't send empty password
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await fetch(`${getApiBaseUrl()}/auth/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setEditDialogOpen(false);
        setSelectedUser(null);
        resetUserForm();
        await loadUsers();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Chyba pri úprave používateľa');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Chyba pri úprave používateľa');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        await loadUsers();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Chyba pri mazaní používateľa');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Chyba pri mazaní používateľa');
    }
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'user'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'employee':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrátor';
      case 'manager':
        return 'Manažér';
      case 'employee':
        return 'Zamestnanec';
      default:
        return 'Používateľ';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
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
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setUserDialogOpen(true)}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Pridať používateľa
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Používatelia ({users.length})
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Používateľ</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rola</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Posledné prihlásenie</TableCell>
                  <TableCell>Vytvorený</TableCell>
                  <TableCell>Akcie</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {user.firstName?.[0] || user.username[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.username
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={user.isActive ? 'Aktívny' : 'Neaktívny'}
                        color={user.isActive ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(user.lastLogin, 'dd.MM.yyyy HH:mm', 'Nikdy')}
                    </TableCell>
                    <TableCell>
                      {formatDate(user.createdAt, 'dd.MM.yyyy', 'Neznámy')}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Upraviť">
                        <IconButton size="small" onClick={() => handleEditUser(user)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {user.id !== state.user?.id && ( // Prevent self-deletion
                        <Tooltip title="Vymazať">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pridať používateľa</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Používateľské meno"
                value={userForm.username}
                onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                required
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
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rola</InputLabel>
                <Select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                  label="Rola"
                >
                  <MenuItem value="user">Používateľ</MenuItem>
                  <MenuItem value="employee">Zamestnanec</MenuItem>
                  <MenuItem value="manager">Manažér</MenuItem>
                  <MenuItem value="admin">Administrátor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUserDialogOpen(false);
            resetUserForm();
          }}>
            Zrušiť
          </Button>
          <Button variant="contained" onClick={handleCreateUser}>
            Vytvoriť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upraviť používateľa</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Používateľské meno"
                value={userForm.username}
                onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                required
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
                label="Nové heslo (nechajte prázdne pre zachovanie)"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rola</InputLabel>
                <Select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                  label="Rola"
                >
                  <MenuItem value="user">Používateľ</MenuItem>
                  <MenuItem value="employee">Zamestnanec</MenuItem>
                  <MenuItem value="manager">Manažér</MenuItem>
                  <MenuItem value="admin">Administrátor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            setSelectedUser(null);
            resetUserForm();
          }}>
            Zrušiť
          </Button>
          <Button variant="contained" onClick={handleUpdateUser}>
            Uložiť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Potvrdiť vymazanie</DialogTitle>
        <DialogContent>
          <Typography>
            Naozaj chcete vymazať používateľa <strong>{selectedUser?.username}</strong>?
            Táto akcia sa nedá vrátiť späť.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setSelectedUser(null);
          }}>
            Zrušiť
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser}>
            Vymazať
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BasicUserManagement;
