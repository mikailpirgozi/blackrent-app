import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import React, { useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { getAPI_BASE_URL } from '../../services/api';

interface ChangePasswordFormProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordForm({
  open,
  onClose,
}: ChangePasswordFormProps) {
  const { state } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Prosím vyplňte všetky polia');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Nové heslo a potvrdenie hesla sa nezhodujú');
      return;
    }

    if (newPassword.length < 6) {
      setError('Nové heslo musí mať aspoň 6 znakov');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${getAPI_BASE_URL()}/auth/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(data.message || 'Chyba pri zmene hesla');
      }
    } catch (error: unknown) {
      setError('Chyba pri zmene hesla');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Zmeniť heslo</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && (
              <Alert severity="success">Heslo bolo úspešne zmenené</Alert>
            )}

            <TextField
              label="Aktuálne heslo"
              type="password"
              fullWidth
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              disabled={loading}
              required
            />

            <TextField
              label="Nové heslo"
              type="password"
              fullWidth
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              disabled={loading}
              required
              helperText="Minimálne 6 znakov"
            />

            <TextField
              label="Potvrdiť nové heslo"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
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
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Menenie...' : 'Zmeniť heslo'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
