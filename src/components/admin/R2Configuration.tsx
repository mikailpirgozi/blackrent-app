import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Storage as StorageIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { apiService as api, API_BASE_URL } from '../../services/api';

interface R2Status {
  configured: boolean;
  message: string;
  missingVariables: string[];
}

export default function R2Configuration() {
  const [r2Status, setR2Status] = useState<R2Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Načítanie R2 stavu
  const loadR2Status = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/migration/r2-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Chyba pri načítaní R2 stavu');
      }
      
      const data = await response.json();
      setR2Status(data);
    } catch (err) {
      setError('Chyba pri načítaní R2 stavu');
      console.error('R2 status error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Spustenie migrácie
  const startMigration = async () => {
    setMigrating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/migration/migrate-to-r2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba pri spúšťaní migrácie');
      }
      
      const data = await response.json();
      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message || 'Chyba pri spúšťaní migrácie');
      console.error('Migration error:', err);
    } finally {
      setMigrating(false);
    }
  };

  // Načítanie stavu pri mount
  useEffect(() => {
    loadR2Status();
  }, []);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudIcon />
        Cloudflare R2 Storage Konfigurácia
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            Aktuálny stav
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography>Načítavam stav...</Typography>
            </Box>
          ) : r2Status ? (
            <Box>
              <Alert 
                severity={r2Status.configured ? 'success' : 'warning'}
                sx={{ mb: 2 }}
                icon={r2Status.configured ? <CheckCircleIcon /> : <WarningIcon />}
              >
                {r2Status.message}
              </Alert>

              {!r2Status.configured && r2Status.missingVariables.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Chýbajúce environment variables:
                  </Typography>
                  <List dense>
                    {r2Status.missingVariables.map((variable) => (
                      <ListItem key={variable}>
                        <ListItemIcon>
                          <ErrorIcon color="error" />
                        </ListItemIcon>
                        <ListItemText primary={variable} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          ) : null}

          <Button 
            variant="outlined" 
            onClick={loadR2Status}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            Obnoviť stav
          </Button>
        </CardContent>
      </Card>

      {r2Status?.configured && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UploadIcon />
              Migrácia súborov
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Migrujte existujúce base64 fotky a podpisy do Cloudflare R2 storage pre lepší výkon a úsporu miesta.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip 
                icon={<StorageIcon />} 
                label="Base64 → R2 URLs" 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                icon={<DownloadIcon />} 
                label="Automatické zálohovanie" 
                color="success" 
                variant="outlined"
              />
              <Chip 
                icon={<CloudIcon />} 
                label="CDN rýchlosť" 
                color="info" 
                variant="outlined"
              />
            </Box>

            <Button
              variant="contained"
              onClick={startMigration}
              disabled={migrating}
              startIcon={migrating ? <CircularProgress size={20} /> : <UploadIcon />}
              sx={{ mr: 2 }}
            >
              {migrating ? 'Migrujem...' : 'Spustiť migráciu'}
            </Button>

            <Button
              variant="outlined"
              onClick={() => window.open('https://dash.cloudflare.com', '_blank')}
            >
              Cloudflare Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {!r2Status?.configured && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon />
              Nastavenie R2 Storage
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pre použitie R2 storage musíte nastaviť environment variables v Railway dashboard.
            </Typography>

            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Potrebné environment variables:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="R2_ENDPOINT" 
                    secondary="https://xxx.r2.cloudflarestorage.com"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="R2_ACCESS_KEY_ID" 
                    secondary="Váš Cloudflare API access key"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="R2_SECRET_ACCESS_KEY" 
                    secondary="Váš Cloudflare API secret key"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="R2_BUCKET_NAME" 
                    secondary="blackrent-storage"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="R2_PUBLIC_URL" 
                    secondary="https://blackrent-storage.xxx.r2.dev"
                  />
                </ListItem>
              </List>
            </Box>

            <Button
              variant="contained"
              onClick={() => window.open('https://dash.cloudflare.com', '_blank')}
              startIcon={<CloudIcon />}
              sx={{ mr: 2 }}
            >
              Vytvoriť R2 Bucket
            </Button>

            <Button
              variant="outlined"
              onClick={() => window.open('https://railway.app', '_blank')}
            >
              Railway Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Výhody R2 Storage */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon />
            Výhody Cloudflare R2
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                💰 Nižšie náklady
              </Typography>
              <Typography variant="body2" color="text.secondary">
                90% lacnejšie ako AWS S3, žiadne egress poplatky
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                ⚡ Rýchlosť
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Globálny CDN, ultra-rýchle načítanie fotiek
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                🔒 Bezpečnosť
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Automatické zálohovanie, enterprise-grade bezpečnosť
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                🌍 Dostupnosť
              </Typography>
              <Typography variant="body2" color="text.secondary">
                99.9% uptime, dostupné z celého sveta
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Error/Success messages */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
    </Box>
  );
} 