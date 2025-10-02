// 🔔 Push Notification Manager Component
// Complete UI for managing push notifications

import {
  AlertCircle as ErrorIcon,
  Bell as NotificationsActive,
  BellOff as NotificationsOff,
  VolumeX as QuietIcon,
  Settings as SettingsIcon,
  TestTube as TestIcon,
  AlertTriangle as WarningIcon,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Button,
} from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Separator,
} from '@/components/ui/separator';
import {
  Label,
} from '@/components/ui/label';
import {
  Input,
} from '@/components/ui/input';
import {
  Switch,
} from '@/components/ui/switch';
import {
  Typography,
} from '@/components/ui/typography';
import React, { useEffect, useState } from 'react';

import {
  pushNotificationService,
} from '../../services/pushNotifications';

const PushNotificationManager = ({
  showAdvanced = false,
  compact = false,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [preferences, setPreferences] =
    useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [testNotification, setTestNotification] = useState<any>({
    title: 'BlackRent Test',
    body: 'Toto je testovacia notifikácia',
    icon: '/logo192.png',
  });

  // Initialize component
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    setLoading(true);

    try {
      // Initialize service
      await pushNotificationService.initialize();

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
  // @ts-ignore
  async function handlePreferenceChange(key, value) {
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
  }

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

  // Get status classes
  const getStatusClasses = () => {
    if (!isSupported) return 'bg-red-100 text-red-700 border-red-200';
    if (!isSubscribed) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (permission !== 'granted') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
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
    const iconProps = { size: 20 };
    if (!isSupported) return React.createElement(ErrorIcon, iconProps);
    if (!isSubscribed) return React.createElement(NotificationsOff, iconProps);
    if (permission !== 'granted') return React.createElement(WarningIcon, iconProps);
    return React.createElement(NotificationsActive, iconProps);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/5"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-4/5"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <Badge
          variant="outline"
          className={`flex items-center gap-2 ${getStatusClasses()}`}
        >
          {getStatusIcon()}
          {getStatusText()}
        </Badge>

        {isSupported && (
          <Switch
            checked={isSubscribed}
            onCheckedChange={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={updating}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/20">
        <CardContent>
          {/* Header */}
          <div className="flex items-center mb-6">
            <div className="mr-4">{getStatusIcon()}</div>
            <div className="flex-1">
              <Typography variant="h6" className="font-semibold">
                Push Notifikácie
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                {getStatusText()}
              </Typography>
            </div>
            <Badge
              variant="outline"
              className={`${getStatusClasses()} font-semibold`}
            >
              {getStatusText()}
            </Badge>
          </div>

          {/* Not supported */}
          {!isSupported && (
            <Alert className="mb-4">
              <AlertDescription>
                Váš prehliadač nepodporuje push notifikácie
              </AlertDescription>
            </Alert>
          )}

          {/* Permission denied */}
          {isSupported && permission === 'denied' && (
            <Alert className="mb-4">
              <AlertDescription>
                Notifikácie sú zakázané. Povoľte ich v nastaveniach prehliadača.
              </AlertDescription>
            </Alert>
          )}

          {/* Main controls */}
          {isSupported && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={
                    isSubscribed ? handleUnsubscribe : handleSubscribe
                  }
                  disabled={updating || permission === 'denied'}
                />
                <Label>
                  {isSubscribed ? 'Notifikácie zapnuté' : 'Zapnúť notifikácie'}
                </Label>
              </div>

              <div className="flex gap-2 flex-wrap">
                {isSubscribed && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettingsDialogOpen(true)}
                    >
                      <SettingsIcon size={16} className="mr-2" />
                      Nastavenia
                    </Button>

                    {showAdvanced && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTestDialogOpen(true)}
                      >
                        <TestIcon size={16} className="mr-2" />
                        Test
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Preferences summary */}
          {isSubscribed && preferences && (
            <div>
              <Typography variant="subtitle2" className="mb-2 font-semibold">
                Aktívne notifikácie:
              </Typography>
              <div className="flex flex-wrap gap-2">
                {preferences.rental_requests && (
                  <Badge variant="secondary" className="text-xs">
                    Žiadosti o prenájom
                  </Badge>
                )}
                {preferences.rental_approvals && (
                  <Badge variant="secondary" className="text-xs">
                    Schválenia prenájmov
                  </Badge>
                )}
                {preferences.rental_reminders && (
                  <Badge variant="secondary" className="text-xs">
                    Pripomienky prenájmov
                  </Badge>
                )}
                {preferences.maintenance_alerts && (
                  <Badge variant="secondary" className="text-xs">
                    Servis vozidiel
                  </Badge>
                )}
                {preferences.payment_reminders && (
                  <Badge variant="secondary" className="text-xs">
                    Platby
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SettingsIcon size={20} />
              Nastavenia notifikácií
            </DialogTitle>
            <DialogDescription>
              Nastavte si preferencie pre push notifikácie
            </DialogDescription>
          </DialogHeader>
          
          {preferences && (
            <div className="space-y-4">
              <Typography
                variant="subtitle2"
                className="font-semibold"
              >
                Typy notifikácií:
              </Typography>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={preferences.rental_requests}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange('rental_requests', checked)
                  }
                />
                <Label>Žiadosti o prenájom</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={preferences.rental_approvals}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange('rental_approvals', checked)
                  }
                />
                <Label>Schválenia prenájmov</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={preferences.rental_reminders}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange('rental_reminders', checked)
                  }
                />
                <Label>Pripomienky prenájmov</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={preferences.maintenance_alerts}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange('maintenance_alerts', checked)
                  }
                />
                <Label>Servis vozidiel</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={preferences.payment_reminders}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange('payment_reminders', checked)
                  }
                />
                <Label>Pripomienky platieb</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={preferences.marketing_notifications}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange('marketing_notifications', checked)
                  }
                />
                <Label>Marketingové oznamy</Label>
              </div>

              <Separator className="my-4" />

              <Typography variant="subtitle2" className="font-semibold">
                Ďalšie možnosti:
              </Typography>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange('email_notifications', checked)
                  }
                />
                <Label>Email notifikácie</Label>
              </div>

              <div className="flex items-center gap-2">
                <QuietIcon size={16} />
                <Typography variant="body2">
                  Tichý režim: {preferences.quiet_hours_start} -{' '}
                  {preferences.quiet_hours_end}
                </Typography>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setSettingsDialogOpen(false)}>Zavrieť</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestIcon size={20} />
              Test notifikácie
            </DialogTitle>
            <DialogDescription>
              Otestujte si push notifikácie
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-title">Nadpis</Label>
              <Input
                id="test-title"
                value={testNotification.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setTestNotification((prev: any) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="test-body">Text</Label>
              <textarea
                id="test-body"
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md resize-none"
                value={testNotification.body}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setTestNotification((prev: any) => ({ ...prev, body: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="test-icon">Ikona (URL)</Label>
              <Input
                id="test-icon"
                value={testNotification.icon}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setTestNotification((prev: any) => ({ ...prev, icon: e.target.value }))
                }
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Zrušiť
            </Button>
            <Button onClick={handleSendTest}>
              <TestIcon size={16} className="mr-2" />
              Odoslať test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PushNotificationManager;

// type NotificationPayload = {
//   title: string;
//   body: string;
//   icon: string;
// }

// type PushNotificationPreferences = {
//   rental_requests: boolean;
//   rental_approvals: boolean;
//   rental_reminders: boolean;
//   maintenance_alerts: boolean;
//   payment_reminders: boolean;
//   marketing_notifications: boolean;
//   email_notifications: boolean;
//   quiet_hours_start: string;
//   quiet_hours_end: string;
// }
