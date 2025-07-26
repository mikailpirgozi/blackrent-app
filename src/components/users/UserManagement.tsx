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
  useMediaQuery,
  useTheme,
  Alert,
  Fab,
  Grid,
  Stack,
  Divider,
  Tooltip,
  CircularProgress
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
  SupervisorAccount as AdminIcon,
  Group as UsersIcon,
  Assessment as ReportIcon,
  Schedule as TimeIcon,
  AdminPanelSettings as ManageIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrátor',
  user: 'Používateľ',
};

const roleDescriptions: Record<string, string> = {
  admin: 'Má prístup ku všetkým funkciám aplikácie',
  user: 'Má prístup k základným funkciám aplikácie',
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin': return 'error';
    case 'user': return 'primary';
    default: return 'default';
  }
};

const getRoleBackground = (role: string) => {
  switch (role) {
    case 'admin': return '#ffebee';
    case 'user': return '#e3f2fd';
    default: return '#f5f5f5';
  }
};

export default function UserManagement() {
  const { state } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [users, setUsers] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Vypočítané štatistiky pomocou useMemo
  const stats = useMemo(() => {
    const total = users.length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const regularUsers = users.filter(user => user.role === 'user').length;
    const recentUsers = users.filter(user => {
      const createdDate = new Date(user.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }).length;
    
    return { total, adminUsers, regularUsers, recentUsers };
  }, [users]);

  // Filtrovaní používatelia
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = !searchQuery || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = !filterRole || user.role === filterRole;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  const fetchUsers = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api';
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error || 'Chyba pri načítavaní používateľov');
      }
    } catch (error) {
      console.error('Chyba pri načítavaní používateľov:', error);
      setError('Chyba pri načítavaní používateľov');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'user',
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
    if (!formData.username || !formData.email || (!editingUser && !formData.password)) {
      setError('Všetky povinné polia musia byť vyplnené');
      return;
    }

    if (!editingUser && formData.password.length < 6) {
      setError('Heslo musí mať aspoň 6 znakov');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api';
      const url = editingUser 
        ? `${API_BASE_URL}/auth/users/${editingUser.id}`
        : `${API_BASE_URL}/auth/users`;
      const method = editingUser ? 'PUT' : 'POST';
      
      const payload: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
      };

      if (!editingUser || formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingUser ? 'Používateľ úspešne aktualizovaný' : 'Používateľ úspešne vytvorený');
        fetchUsers();
        setTimeout(() => {
          handleCloseDialog();
        }, 1500);
      } else {
        setError(data.error || 'Chyba pri ukladaní používateľa');
      }
    } catch (error) {
      console.error('Chyba pri ukladaní používateľa:', error);
      setError('Chyba pri ukladaní používateľa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Naozaj chcete vymazať tohto používateľa?')) {
      return;
    }

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api';
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Používateľ úspešne vymazaný');
        fetchUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Chyba pri mazaní používateľa');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Chyba pri mazaní používateľa:', error);
      setError('Chyba pri mazaní používateľa');
      setTimeout(() => setError(null), 3000);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterRole('');
  };

  const hasActiveFilters = searchQuery || filterRole;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Modern Header */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ManageIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Správa Používateľov
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Správa účtov a oprávnení používateľov
                </Typography>
              </Box>
            </Box>
            
            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                Pridať používateľa
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    CELKOM POUŽÍVATEĽOV
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.total}
                  </Typography>
                </Box>
                <ReportIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    ADMINISTRÁTORI
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.adminUsers}
                  </Typography>
                </Box>
                <AdminIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    POUŽÍVATELIA
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.regularUsers}
                  </Typography>
                </Box>
                <UsersIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    NOVÍ (30 DNÍ)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.recentUsers}
                  </Typography>
                </Box>
                <TimeIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: showFilters ? 2 : 0 }}>
            <TextField
              placeholder="Hľadať používateľov..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: searchQuery && (
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseIcon />
                  </IconButton>
                )
              }}
            />
            
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                minWidth: 120,
                backgroundColor: showFilters ? '#1976d2' : 'transparent',
              }}
            >
              Filtre
              {hasActiveFilters && (
                <Chip 
                  label={filteredUsers.length} 
                  size="small" 
                  sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  color={showFilters ? 'default' : 'primary'}
                />
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="text"
                onClick={clearFilters}
                sx={{ color: 'error.main' }}
              >
                Vymazať
              </Button>
            )}
          </Box>
          
          {showFilters && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Rola</InputLabel>
                    <Select
                      value={filterRole}
                      label="Rola"
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <MenuItem value="">Všetky role</MenuItem>
                      <MenuItem value="admin">Administrátori</MenuItem>
                      <MenuItem value="user">Používatelia</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Users Cards */}
      {filteredUsers.length === 0 ? (
        // Empty State
        <Card sx={{ textAlign: 'center', py: 6, mt: 3 }}>
          <CardContent>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {hasActiveFilters ? 'Žiadni používatelia nevyhovujú filtrom' : 'Žiadni používatelia'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {hasActiveFilters ? 'Skúste zmeniť filtre alebo vyhľadávanie' : 'Začnite pridaním prvého používateľa'}
            </Typography>
            {!hasActiveFilters && (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ mt: 2 }}
              >
                Pridať používateľa
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredUsers.map((user) => (
            <Grid item xs={12} sm={6} lg={4} key={user.id}>
              <Card sx={{ 
                height: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                border: `1px solid ${
                  user.role === 'admin' ? '#f44336' : '#1976d2'
                }`,
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  transform: 'translateY(-4px)',
                }
              }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Header s používateľom a rolou */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PersonIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                          {user.username}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                    <Chip
                      label={roleLabels[user.role] || user.role}
                      color={getRoleColor(user.role) as any}
                      sx={{ 
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                  
                  {/* Informácie o používateľovi */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ 
                      backgroundColor: getRoleBackground(user.role),
                      borderRadius: 1,
                      p: 1.5,
                      border: `1px solid ${
                        user.role === 'admin' ? '#ffcdd2' : '#bbdefb'
                      }`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SecurityIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          {roleLabels[user.role] || user.role}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {roleDescriptions[user.role] || ''}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1,
                      p: 1
                    }}>
                      <TimeIcon sx={{ fontSize: 18, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        Vytvorený: {format(new Date(user.createdAt), 'dd.MM.yyyy', { locale: sk })}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Action Buttons */}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(user)}
                      sx={{
                        borderColor: '#1976d2',
                        color: '#1976d2',
                        '&:hover': {
                          borderColor: '#1565c0',
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                        },
                      }}
                    >
                      Upraviť
                    </Button>
                    {user.id !== state.user?.id && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(user.id)}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(244, 67, 54, 0.04)',
                          },
                        }}
                      >
                        Vymazať
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleOpenDialog()}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            },
          }}
        >
          <PersonAddIcon />
        </Fab>
      )}

      {/* Dialog for creating/editing users */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        disableRestoreFocus
        keepMounted={false}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <SecurityIcon />
          {editingUser ? 'Upraviť používateľa' : 'Pridať používateľa'}
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Používateľské meno"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              required
            />
            
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
            
            <TextField
              fullWidth
              label={editingUser ? "Nové heslo (nechajte prázdne ak nechcete zmeniť)" : "Heslo"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required={!editingUser}
              helperText="Minimálne 6 znakov"
            />
            
            <FormControl fullWidth>
              <InputLabel>Rola</InputLabel>
              <Select
                value={formData.role}
                label="Rola"
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              >
                <MenuItem value="admin">
                  <Box>
                    <Typography>Administrátor</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Má prístup ku všetkým funkciám aplikácie
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="user">
                  <Box>
                    <Typography>Používateľ</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Má prístup k základným funkciám aplikácie
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ mr: 1 }}>
            Zrušiť
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              }
            }}
          >
            {loading ? 'Ukladá sa...' : (editingUser ? 'Aktualizovať' : 'Vytvoriť')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 