import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Container,
  Paper,
  Avatar,
  Divider,
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { LockOutlined as LockIcon, AccountCircle as AccountIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { LoginCredentials } from '../../types';
import { UnifiedButton } from '../ui';
import { useNavigate } from 'react-router-dom';
import { useAuthError } from '../../hooks/useEnhancedError';
import { EnhancedErrorToast } from '../common/EnhancedErrorToast';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { login, state } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(true); // defaultne zapnuté
  const { error, showError, clearError, executeWithErrorHandling } = useAuthError();
  const [showDemo, setShowDemo] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!credentials.username || !credentials.password) {
      showError('Prosím zadajte používateľské meno a heslo', { action: 'login', entity: 'credentials' });
      return;
    }

    const success = await executeWithErrorHandling(
      async () => {
        const result = await login(credentials, rememberMe);
        if (!result) {
          throw new Error('Nesprávne používateľské meno alebo heslo');
        }
        return result;
      },
      { action: 'login', entity: 'user' }
    );

    if (success) {
      onLoginSuccess?.();
      // 🚀 DIRECT navigation to /vehicles to bypass root redirect timing issue
      setTimeout(() => {
        navigate('/vehicles');
      }, 100);
    }
  };

  const demoAccounts = [
    { username: 'admin', label: 'Admin', role: 'Administrátor', desc: 'Všetky práva', password: 'admin123' },
    { username: 'employee', label: 'Zamestnanec', role: 'Zamestnanec', desc: 'Obmedzené práva', password: 'employee123' },
    { username: 'company1', label: 'Firma', role: 'Firma', desc: 'Iba vlastné dáta', password: 'company123' },
  ];

  const handleDemoLogin = async (username: string) => {
    const account = demoAccounts.find(acc => acc.username === username);
    if (account) {
      const success = await login({ username, password: account.password }, rememberMe);
      if (success) {
        onLoginSuccess?.();
        // 🚀 DIRECT navigation to /vehicles to bypass root redirect timing issue
        setTimeout(() => {
          navigate('/vehicles');
        }, 100);
      }
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400, mt: 4 }}>
          <CardContent sx={{ padding: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                <LockIcon />
              </Avatar>
                      <Typography component="h1" variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
          BlackRent
        </Typography>
              <Typography variant="h6" sx={{ color: 'text.secondary', mt: 1 }}>
                Prihlásenie do systému
              </Typography>
            </Box>

            {/* Error handling sa teraz zobrazuje cez EnhancedErrorToast */}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Používateľské meno"
                name="username"
                autoComplete="username"
                autoFocus
                value={credentials.username}
                onChange={handleChange}
                disabled={state.isLoading}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Heslo"
                type="password"
                id="password"
                autoComplete="current-password"
                value={credentials.password}
                onChange={handleChange}
                disabled={state.isLoading}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    name="rememberMe"
                    color="primary"
                  />
                }
                label={
                                  <Typography color="text.primary" sx={{ fontWeight: 'bold' }}>
                  Zapamätať si prihlásenie
                </Typography>
                }
                sx={{ mb: 2 }}
              />
              
              <UnifiedButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={state.isLoading}
                loadingText="Prihlasuje sa..."
                sx={{ mb: 2 }}
              >
                Prihlásiť sa
              </UnifiedButton>
            </Box>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                alebo
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <UnifiedButton
                variant="secondary"
                onClick={() => setShowDemo(!showDemo)}
              >
                {showDemo ? 'Skryť demo účty' : 'Ukázať demo účty'}
              </UnifiedButton>
            </Box>

            {showDemo && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', textAlign: 'center' }}>
                  Demo účty (kliknite na účet alebo zadajte údaje manuálne):
                </Typography>
                {demoAccounts.map((account) => (
                  <Paper
                    key={account.username}
                    sx={{
                      p: 2,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => handleDemoLogin(account.username)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AccountIcon color="primary" />
                      <Box>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'bold' }}>
                          {account.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {account.desc}
                        </Typography>
                        <Typography variant="caption" color="primary">
                          {account.username} / {account.password}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={account.role}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © 2024 BlackRent - Systém správy prenájmu vozidiel
          </Typography>
          
          {/* Malá nápoveda o funkcii zapamätania */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {rememberMe 
              ? 'Prihlásenie zostane aktívne aj po zatvorení prehliadača' 
              : 'Prihlásenie sa ukončí po zatvorení prehliadača'
            }
          </Typography>
        </Box>
      </Box>
      
      {/* Enhanced Error Toast */}
      <EnhancedErrorToast
        error={error}
        context={{ action: 'login', location: 'auth' }}
        onClose={clearError}
        position="top"
      />
    </Container>
  );
} 