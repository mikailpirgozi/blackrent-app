// 📱 PWA Install Prompt Component
// Provides elegant install prompt with animations and user guidance

import {
  X as CloseIcon,
  Monitor as DesktopIcon,
  Download as InstallIcon,
  Bell as NotificationIcon,
  Smartphone as PhoneIcon,
  Zap as SpeedIcon,
  Wifi as WifiIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Typography } from '@/components/ui/typography';
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

import { usePWA } from '../../hooks/usePWA';

interface PWAInstallPromptProps {
  autoShow?: boolean;
  delay?: number;
  onInstall?: (_success: boolean) => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  autoShow = true,
  delay = 5000,
  onInstall,
}) => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  
  // Simple mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [showDialog, setShowDialog] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Auto-show logic
  useEffect(() => {
    if (!autoShow || dismissed || isInstalled || !isInstallable) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowFab(true);

      // Show dialog after additional delay on mobile
      if (isMobile) {
        window.setTimeout(() => setShowDialog(true), 3000);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [autoShow, delay, dismissed, isInstalled, isInstallable, isMobile]);

  // Hide when installed
  useEffect(() => {
    if (isInstalled) {
      setShowDialog(false);
      setShowFab(false);
    }
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!isInstallable) return;

    setInstalling(true);
    try {
      const success = await promptInstall();

      if (success) {
        setShowDialog(false);
        setShowFab(false);
        onInstall?.(true);
      }
    } catch (error) {
      console.error('Install failed:', error);
      onInstall?.(false);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowDialog(false);
    setDismissed(true);

    // Keep FAB visible for later access
    window.setTimeout(() => {
      setShowFab(true);
    }, 1000);
  };

  const handleFabClick = () => {
    setShowDialog(true);
  };

  if (isInstalled || !isInstallable) {
    return null;
  }

  const features = [
    {
      icon: <SpeedIcon className="h-5 w-5 text-primary" />,
      title: 'Rýchlejšie načítanie',
      description: 'Okamžité spustenie z plochy',
    },
    {
      icon: <WifiIcon className="h-5 w-5 text-primary" />,
      title: 'Offline prístup',
      description: 'Funguje aj bez internetu',
    },
    {
      icon: <NotificationIcon className="h-5 w-5 text-primary" />,
      title: 'Notifikácie',
      description: 'Oznámenia priamo na zariadenie',
    },
  ];

  return (
    <>
      {/* Install Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isMobile ? (
                  <PhoneIcon className="h-5 w-5 text-primary" />
                ) : (
                  <DesktopIcon className="h-5 w-5 text-primary" />
                )}
                <Typography variant="h6">
                  Nainštalovať BlackRent
                </Typography>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-6 w-6"
              >
                <CloseIcon className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Získajte najlepší zážitok s nainštalovanou aplikáciou
            </DialogDescription>
          </DialogHeader>

          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-3xl text-white animate-pulse">
              🚗
            </div>

            <Typography variant="h6" className="mb-2">
              Získajte najlepší zážitok
            </Typography>

            <Typography variant="body2" className="text-muted-foreground mb-4">
              Nainštalujte si BlackRent ako aplikáciu pre{' '}
              {isMobile ? 'mobilné zariadenie' : 'počítač'} a užívajte si všetky
              výhody.
            </Typography>
          </div>

          <div className="mb-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 py-3",
                  index < features.length - 1 && "border-b border-border"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <Typography variant="subtitle2" className="font-semibold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" className="text-muted-foreground">
                    {feature.description}
                  </Typography>
                </div>
              </div>
            ))}
          </div>

          {isMobile && (
            <Alert>
              <AlertDescription className="text-center">
                💡 <strong>Tip:</strong> Po inštalácii nájdete BlackRent na
                ploche a v zozname aplikácií
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>

          <DialogFooter className="flex justify-between">
            <Button onClick={handleDismiss} variant="outline">
              Neskôr
            </Button>
            <Button
              onClick={handleInstall}
              disabled={installing}
              className="gap-2"
            >
              {installing ? (
                'Inštalujem...'
              ) : (
                <>
                  <InstallIcon className="h-4 w-4" />
                  Nainštalovať
                </>
              )}
            </Button>
          </DialogFooter>
      </Dialog>

      {/* Floating Action Button */}
      {showFab && (
        <Button
          onClick={handleFabClick}
          size="icon"
          className="fixed bottom-5 right-5 z-[1000] h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform animate-bounce"
          aria-label="Nainštalovať aplikáciu"
        >
          <InstallIcon className="h-6 w-6" />
        </Button>
      )}

    </>
  );
};

// Simple Install Button Component
interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'outline',
  size = 'default',
  fullWidth = false,
  children,
}) => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  };

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={fullWidth ? 'w-full' : ''}
      onClick={handleInstall}
      disabled={installing}
    >
      {installing ? (
        'Inštalujem...'
      ) : (
        <>
          <InstallIcon className="h-4 w-4 mr-2" />
          {children || 'Nainštalovať aplikáciu'}
        </>
      )}
    </Button>
  );
};

export default PWAInstallPrompt;
