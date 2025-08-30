// 🔔 Push Notification Manager Component
// Complete UI for managing push notifications

import {
  NotificationsActive,
  NotificationsOff,
  Settings as SettingsIcon,
  Science as TestIcon,
  Analytics as AnalyticsIcon,
  Schedule as ScheduleIcon,
  VolumeOff as QuietIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormGroup,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import React, { useState, useEffect } from 'react';

import {
  pushNotificationService,
  type PushNotificationPreferences,
  type NotificationPayload,
} from '../../services/pushNotifications';

interface PushNotificationManagerProps {
  showAdvanced?: boolean;
  compact?: boolean;
}

const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({
  showAdvanced = false,
  compact = false,
}) => {
  const theme = useTheme();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [preferences, setPreferences] =
    useState<PushNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [testNotification, setTestNotification] = useState<NotificationPayload>(
    {
      title: 'BlackRent Test',
      body: 'Toto je testovacia notifikácia',
      icon: '/logo192.png',
    }
  );

  // Initialize component
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    setLoading(true);

    try {
      // Initialize service
      const initialized = await pushNotificationService.initialize();

      // Get status
      const status = await pushNotificationService.getSubscriptionStatus();
      setIsSupported(status.isSupported);
      setIsSubscribed(status.isSubscribed);
      setPermission(status.permission);

      // Get preferences if subscribed
      if (status.isSubscribed) {
        const prefs =
          await pushNotificationService.getNotificationPreferences();
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to notifications
  const handleSubscribe = async () => {
    setUpdating(true);

    try {
      const success = await pushNotificationService.subscribe();

      if (success) {
        setIsSubscribed(true);
        setPermission('granted');

        // Load preferences
        const prefs =
          await pushNotificationService.getNotificationPreferences();
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Unsubscribe from notifications
  const handleUnsubscribe = async () => {
    setUpdating(true);

    try {
      const success = await pushNotificationService.unsubscribe();

      if (success) {
        setIsSubscribed(false);
        setPreferences(null);
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Update preferences
  const handlePreferenceChange = async (
    key: keyof PushNotificationPreferences,
    value: boolean | string
  ) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      [key]: value,
    };

    setPreferences(updatedPreferences);

    try {
      await pushNotificationService.updateNotificationPreferences({
        [key]: value,
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Revert on error
      setPreferences(preferences);
    }
  };

  // Send test notification
  const handleSendTest = async () => {
    try {
      const success =
        await pushNotificationService.sendTestNotification(testNotification);

      if (success) {
        setTestDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (!isSupported) return theme.palette.error.main;
    if (!isSubscribed) return theme.palette.warning.main;
    if (permission !== 'granted') return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Get status text
  const getStatusText = () => {
    if (!isSupported) return 'Nepodporované';
    if (!isSubscribed) return 'Neaktivované';
    if (permission !== 'granted') return 'Bez povolenia';
    return 'Aktívne';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!isSupported) return <ErrorIcon />;
    if (!isSubscribed) return <NotificationsOff />;
    if (permission !== 'granted') return <WarningIcon />;
    return <NotificationsActive />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="80%" height={24} sx={{ mt: 1 }} />
          <Skeleton variant="rectangular" height={40} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={isSubscribed ? 'success' : 'default'}
          variant={isSubscribed ? 'filled' : 'outlined'}
        />

        {isSupported && (
          <Switch
            checked={isSubscribed}
            onChange={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={updating}
          />
        )}
      </Box>
    );
  }

  return (
    <>
      <Card
        sx={{
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        }}
      >
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ mr: 2 }}>{getStatusIcon()}</Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Push Notifikácie
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getStatusText()}
              </Typography>
            </Box>
            <Chip
              label={getStatusText()}
              sx={{
                backgroundColor: alpha(getStatusColor(), 0.1),
                color: getStatusColor(),
                fontWeight: 600,
              }}
            />
          </Box>

          {/* Not supported */}
          {!isSupported && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Váš prehliadač nepodporuje push notifikácie
            </Alert>
          )}

          {/* Permission denied */}
          {isSupported && permission === 'denied' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Notifikácie sú zakázané. Povoľte ich v nastaveniach prehliadača.
            </Alert>
          )}

          {/* Main controls */}
          {isSupported && (
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isSubscribed}
                    onChange={
                      isSubscribed ? handleUnsubscribe : handleSubscribe
                    }
                    disabled={updating || permission === 'denied'}
                  />
                }
                label={
                  isSubscribed ? 'Notifikácie zapnuté' : 'Zapnúť notifikácie'
                }
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {isSubscribed && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SettingsIcon />}
                      onClick={() => setSettingsDialogOpen(true)}
                    >
                      Nastavenia
                    </Button>

                    {showAdvanced && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<TestIcon />}
                        onClick={() => setTestDialogOpen(true)}
                      >
                        Test
                      </Button>
                    )}
                  </>
                )}
              </Box>
            </Box>
          )}

          {/* Preferences summary */}
          {isSubscribed && preferences && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Aktívne notifikácie:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {preferences.rental_requests && (
                  <Chip size="small" label="Žiadosti o prenájom" />
                )}
                {preferences.rental_approvals && (
                  <Chip size="small" label="Schválenia prenájmov" />
                )}
                {preferences.rental_reminders && (
                  <Chip size="small" label="Pripomienky prenájmov" />
                )}
                {preferences.maintenance_alerts && (
                  <Chip size="small" label="Servis vozidiel" />
                )}
                {preferences.payment_reminders && (
                  <Chip size="small" label="Platby" />
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            Nastavenia notifikácií
          </Box>
        </DialogTitle>
        <DialogContent>
          {preferences && (
            <FormGroup>
              <Typography
                variant="subtitle2"
                sx={{ mt: 2, mb: 1, fontWeight: 600 }}
              >
                Typy notifikácií:
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.rental_requests}
                    onChange={e =>
                      handlePreferenceChange(
                        'rental_requests',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Žiadosti o prenájom"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.rental_approvals}
                    onChange={e =>
                      handlePreferenceChange(
                        'rental_approvals',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Schválenia prenájmov"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.rental_reminders}
                    onChange={e =>
                      handlePreferenceChange(
                        'rental_reminders',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Pripomienky prenájmov"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.maintenance_alerts}
                    onChange={e =>
                      handlePreferenceChange(
                        'maintenance_alerts',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Servis vozidiel"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.payment_reminders}
                    onChange={e =>
                      handlePreferenceChange(
                        'payment_reminders',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Pripomienky platieb"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.marketing_notifications}
                    onChange={e =>
                      handlePreferenceChange(
                        'marketing_notifications',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Marketingové oznamy"
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Ďalšie možnosti:
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.email_notifications}
                    onChange={e =>
                      handlePreferenceChange(
                        'email_notifications',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Email notifikácie"
              />

              <Box
                sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <QuietIcon fontSize="small" />
                <Typography variant="body2">
                  Tichý režim: {preferences.quiet_hours_start} -{' '}
                  {preferences.quiet_hours_end}
                </Typography>
              </Box>
            </FormGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Zavrieť</Button>
        </DialogActions>
      </Dialog>

      {/* Test Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TestIcon />
            Test notifikácie
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nadpis"
            value={testNotification.title}
            onChange={e =>
              setTestNotification(prev => ({ ...prev, title: e.target.value }))
            }
            sx={{ mb: 2, mt: 1 }}
          />

          <TextField
            fullWidth
            label="Text"
            multiline
            rows={3}
            value={testNotification.body}
            onChange={e =>
              setTestNotification(prev => ({ ...prev, body: e.target.value }))
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Ikona (URL)"
            value={testNotification.icon}
            onChange={e =>
              setTestNotification(prev => ({ ...prev, icon: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Zrušiť</Button>
          <Button
            variant="contained"
            onClick={handleSendTest}
            startIcon={<TestIcon />}
          >
            Odoslať test
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PushNotificationManager;
