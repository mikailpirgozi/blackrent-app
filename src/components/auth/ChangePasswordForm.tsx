import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../services/api';

interface ChangePasswordFormProps {
  open: boolean;
  onClose: () => void;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordForm({ open, onClose }: ChangePasswordFormProps) {
  const { state } = useAuth();
  const [passwords, setPasswords] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof PasswordData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validácia
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setError('Všetky polia sú povinné');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('Nové heslo musí mať minimálne 6 znakov');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Nové heslo a potvrdenie hesla sa nezhodujú');
      return;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      setError('Nové heslo musí byť odlišné od súčasného hesla');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Heslo úspešne zmenené');
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Chyba pri zmene hesla');
      }
    } catch (error) {
      console.error('Chyba pri zmene hesla:', error);
      setError('Chyba pri zmene hesla');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LockIcon color="primary" />
          <Typography variant="h6" component="div">
            Zmena hesla
          </Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3}>
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

            <TextField
              fullWidth
              label="Súčasné heslo"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwords.currentPassword}
              onChange={handleChange('currentPassword')}
              required
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('current')}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Nové heslo"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwords.newPassword}
              onChange={handleChange('newPassword')}
              required
              disabled={loading}
              helperText="Minimálne 6 znakov"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('new')}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Potvrdenie nového hesla"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwords.confirmPassword}
              onChange={handleChange('confirmPassword')}
              required
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('confirm')}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Typography variant="body2" color="text.secondary">
              Heslo bude trvalo uložené a zabezpečené v databáze.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Zrušiť
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Menenie...' : 'Zmeniť heslo'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 