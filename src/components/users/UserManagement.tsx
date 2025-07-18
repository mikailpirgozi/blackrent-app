import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Grid,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme,
  Alert,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/auth/users', {
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
      const url = editingUser 
                ? `/api/auth/users/${editingUser.id}`
        : '/api/auth/users';
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
      const response = await fetch(`/api/auth/users/${userId}`, {
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'user': return 'primary';
      default: return 'default';
    }
  };

  // Desktop view
  const DesktopView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Používateľ</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Rola</TableCell>
            <TableCell>Vytvorený</TableCell>
            <TableCell>Akcie</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon color="primary" />
                  <Typography sx={{ fontWeight: 'bold', color: 'white' }}>
                    {user.username}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography sx={{ color: 'white' }}>
                  {user.email}
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Chip
                    label={roleLabels[user.role] || user.role}
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                    {roleDescriptions[user.role] || ''}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography sx={{ color: 'white' }}>
                  {new Date(user.createdAt).toLocaleDateString('sk-SK')}
                </Typography>
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(user)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                {user.id !== state.user?.id && (
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(user.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Mobile view
  const MobileView = () => (
    <Box>
      {users.map((user) => (
        <Card key={user.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PersonIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                {user.username}
              </Typography>
              <Chip
                label={roleLabels[user.role] || user.role}
                color={getRoleColor(user.role)}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user.email}
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ color: 'white' }}>
              Vytvorený: {new Date(user.createdAt).toLocaleDateString('sk-SK')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {roleDescriptions[user.role] || ''}
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={() => handleOpenDialog(user)}
            >
              Upraviť
            </Button>
            {user.id !== state.user?.id && (
              <Button
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => handleDelete(user.id)}
                color="error"
              >
                Vymazať
              </Button>
            )}
          </CardActions>
        </Card>
      ))}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'white' }}>
          Správa používateľov
        </Typography>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ fontWeight: 'bold' }}
          >
            Pridať používateľa
          </Button>
        )}
      </Box>

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

      {users.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Žiadni používatelia
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Zatiaľ neboli vytvorení žiadni používatelia.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Pridať prvého používateľa
          </Button>
        </Paper>
      ) : (
        <>
          {isMobile ? <MobileView /> : <DesktopView />}
        </>
      )}

      {/* Mobile FAB */}
      {isMobile && users.length > 0 && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 90, right: 16 }}
          onClick={() => handleOpenDialog()}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialog for creating/editing users */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon color="primary" />
            <Typography sx={{ fontWeight: 'bold', color: 'white' }}>
              {editingUser ? 'Upraviť používateľa' : 'Pridať používateľa'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
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
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Zrušiť
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ fontWeight: 'bold' }}
          >
            {loading ? 'Ukladá sa...' : (editingUser ? 'Aktualizovať' : 'Vytvoriť')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 