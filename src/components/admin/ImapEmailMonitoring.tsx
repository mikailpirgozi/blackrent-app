import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Email as EmailIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  CheckCircle as TestIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  PlayArrow,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface ImapStatus {
  running: boolean;
  enabled: boolean;
  timestamp: string;
  config: {
    host: string;
    user: string;
    enabled: boolean;
  };
}

interface ImapTestResult {
  connected: boolean;
  timestamp: string;
  config: {
    host: string;
    port: string;
    user: string;
  };
}

const ImapEmailMonitoring: React.FC = () => {
  const [status, setStatus] = useState<ImapStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<ImapTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initializeStatus = async () => {
      setInitialLoading(true);
      await fetchStatus();
      setInitialLoading(false);
    };
    
    initializeStatus();
  }, []);

  // Separátny useEffect pre interval - spúšťa sa len ak je IMAP povolené
  useEffect(() => {
    if (!status || status.enabled === false) {
      return; // Nespúšťaj interval ak je IMAP vypnuté
    }

    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [status?.enabled]);

  // Ak sa IMAP ešte načítava, zobraz loading
  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Načítavam IMAP konfiguráciu...</Typography>
      </Box>
    );
  }

  // Ak je IMAP vypnuté, zobraz info hlásenie
  if (status && status.enabled === false) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            📧 IMAP Email Monitoring je vypnuté
          </Typography>
          <Typography variant="body2">
            IMAP služba je momentálne vypnutá v konfigurácii servera. 
            Pre aktiváciu kontaktujte administrátora systému.
          </Typography>
        </Alert>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ⚙️ Konfigurácia
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Host:</strong> {status.config.host}<br/>
              <strong>Používateľ:</strong> {status.config.user}<br/>
              <strong>Stav:</strong> Vypnuté
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const fetchStatus = async () => {
    try {
      const data = await apiService.getImapStatus();
      setStatus(data);
    } catch (err: any) {
      console.error('Error fetching IMAP status:', err);
      setError('Nepodarilo sa načítať status IMAP monitoringu');
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setTestResult(null);

      const data = await apiService.testImapConnection();
      setTestResult(data);
      setSuccess(data.connected ? 'Test pripojenia úspešný!' : 'Test pripojenia neúspešný');
    } catch (err: any) {
      setError('Nepodarilo sa otestovať IMAP pripojenie');
      console.error('IMAP test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = async () => {
    try {
      setLoading(true);
      setError(null);

      await apiService.startImapMonitoring();
      
      setSuccess('IMAP monitoring spustený!');
      await fetchStatus();
    } catch (err: any) {
      setError('Nepodarilo sa spustiť IMAP monitoring');
      console.error('IMAP start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stopMonitoring = async () => {
    try {
      setLoading(true);
      setError(null);

      await apiService.stopImapMonitoring();
      
      setSuccess('IMAP monitoring zastavený!');
      await fetchStatus();
    } catch (err: any) {
      setError('Nepodarilo sa zastaviť IMAP monitoring');
      console.error('IMAP stop error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkNow = async () => {
    try {
      setLoading(true);
      setError(null);

      await apiService.checkImapNow();
      
      setSuccess('Kontrola emailov dokončená!');
    } catch (err: any) {
      setError('Nepodarilo sa skontrolovať emaily');
      console.error('IMAP check error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📧 IMAP Email Monitoring
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Automatické sledovanie schránky <strong>info@blackrent.sk</strong> pre nové objednávky od <strong>objednavky@blackrent.sk</strong>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">
                  📊 Status monitoringu
                </Typography>
                <Tooltip title="Obnoviť status">
                  <IconButton onClick={fetchStatus} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {status ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      label={status.running ? 'BEŽÍ' : 'ZASTAVENÝ'}
                      color={status.running ? 'success' : 'default'}
                      icon={status.running ? <PlayArrow /> : <StopIcon />}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(status.timestamp).toLocaleString('sk')}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Konfigurácia:
                  </Typography>
                  <Box>
                    <Typography variant="body2">
                      <strong>Server:</strong> {status.config.host}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Používateľ:</strong> {status.config.user}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Heslo:</strong> {status.config.enabled ? '✅ Nastavené' : '❌ Chýba'}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <CircularProgress size={24} />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Controls Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎛️ Ovládanie
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<TestIcon />}
                  onClick={testConnection}
                  disabled={loading}
                  fullWidth
                >
                  Test pripojenia
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  startIcon={<StartIcon />}
                  onClick={startMonitoring}
                  disabled={loading || status?.running}
                  fullWidth
                >
                  Spustiť monitoring
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={stopMonitoring}
                  disabled={loading || !status?.running}
                  fullWidth
                >
                  Zastaviť monitoring
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={checkNow}
                  disabled={loading}
                  fullWidth
                >
                  Skontrolovať teraz
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Results */}
        {testResult && (
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                🧪 Výsledok testu pripojenia
              </Typography>
              
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Chip
                  label={testResult.connected ? 'PRIPOJENÉ' : 'NEPRIPOJENÉ'}
                  color={testResult.connected ? 'success' : 'error'}
                />
                <Typography variant="body2" color="text.secondary">
                  {new Date(testResult.timestamp).toLocaleString('sk')}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>Server:</strong> {testResult.config.host}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>Port:</strong> {testResult.config.port}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>Používateľ:</strong> {testResult.config.user}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Info Card */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="subtitle2" gutterBottom>
              ℹ️ Ako to funguje:
            </Typography>
            <Typography variant="body2" component="div">
              <ul>
                <li>Monitoring kontroluje schránku <strong>info@blackrent.sk</strong> každých 30 sekúnd</li>
                <li>Filtrovanie iba emailov od <strong>objednavky@blackrent.sk</strong></li>
                <li>Automatické parsovanie obsahu a vytvorenie pending prenájmu</li>
                <li>Spracované emaily sa označia ako prečítané</li>
                <li>Nové prenájmy sa zobrazia v <strong>Čakajúce prenájmy</strong></li>
              </ul>
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {loading && (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default ImapEmailMonitoring;