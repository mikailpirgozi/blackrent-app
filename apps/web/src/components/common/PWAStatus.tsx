// 📊 PWA Status Component
// Shows PWA state, offline status, and management options

import {
  Trash2 as ClearCacheIcon,
  Info as InfoIcon,
  Download as InstallIcon,
  CloudCheck as InstalledIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  RefreshCw as RefreshIcon,
  Settings as SettingsIcon,
  RotateCcw as UpdateIcon,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Button,
} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Typography,
} from '@/components/ui/typography';
import { useState } from 'react';

import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { usePWA } from '../../hooks/usePWA';


export const PWAStatus = ({
  showDetailed = false,
  position = 'relative',
}) => {
  const {
    isInstalled,
    isInstallable,
    isOffline,
    isUpdateAvailable,
    promptInstall,
    updateServiceWorker,
    clearCache,
    checkForUpdates,
    getVersion,
  } = usePWA();

  const { networkQuality } = useNetworkStatus();
  const isSlowConnection = networkQuality === 'slow';

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [version, setVersion] = useState<string>('');
  const [, setLoading] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShowInfo = async () => {
    handleMenuClose();
    setLoading(true);
    try {
      const versionInfo = await getVersion();
      setVersion(versionInfo);
      setShowDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    handleMenuClose();
    setLoading(true);
    try {
      await promptInstall();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    handleMenuClose();
    setLoading(true);
    try {
      await updateServiceWorker();
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    handleMenuClose();
    setLoading(true);
    try {
      await clearCache();
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUpdates = async () => {
    handleMenuClose();
    setLoading(true);
    try {
      await checkForUpdates();
    } finally {
      setLoading(false);
    }
  };

  // Get status color and icon
  const getStatusInfo = () => {
    if (isOffline) {
      return {
        color: 'error',
        icon: <OfflineIcon size={16} />,
        label: 'Offline',
        description: 'Bez internetového pripojenia',
      };
    }

    if (isInstalled) {
      return {
        color: 'success',
        icon: <InstalledIcon size={16} />,
        label: 'Nainštalované',
        description: 'Aplikácia je nainštalovaná',
      };
    }

    if (isInstallable) {
      return {
        color: 'primary',
        icon: <InstallIcon size={16} />,
        label: 'Môže sa nainštalovať',
        description: 'Kliknite pre inštaláciu',
      };
    }

    return {
      color: 'default',
      icon: <OnlineIcon size={16} />,
      label: 'Online',
      description: 'Štandardný web prehliadač',
    };
  };

  const statusInfo = getStatusInfo();

  // Simple chip version
  if (!showDetailed) {
    return (
      <div className={position === 'fixed' ? 'fixed top-4 right-20 z-50 md:right-20 md:top-4 right-4 top-20' : ''}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={isUpdateAvailable ? 'destructive' : 'secondary'}
                className={isUpdateAvailable ? 'animate-pulse' : ''}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isInstallable ? handleInstall : handleMenuClick}
                  className="flex items-center gap-2 text-xs md:text-sm h-7 md:h-8"
                >
                  {statusInfo.icon}
                  {statusInfo.label}
                </Button>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {statusInfo.description}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Detailed version
  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Connection Status */}
        <Badge
          variant="outline"
          className={`flex items-center gap-2 ${
            isOffline 
              ? 'border-red-500 text-red-700 bg-red-50' 
              : isSlowConnection 
                ? 'border-yellow-500 text-yellow-700 bg-yellow-50'
                : 'border-green-500 text-green-700 bg-green-50'
          }`}
        >
          {isOffline ? <OfflineIcon size={16} /> : <OnlineIcon size={16} />}
          {isOffline ? 'Offline' : `Online (${networkQuality})`}
        </Badge>

        {/* PWA Status */}
        <Button
          variant="outline"
          size="sm"
          onClick={isInstallable ? handleInstall : handleMenuClick}
          className="flex items-center gap-2"
        >
          {statusInfo.icon}
          {statusInfo.label}
        </Button>

        {/* Update Available */}
        {isUpdateAvailable && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdate}
            className="flex items-center gap-2 border-blue-500 text-blue-700 bg-blue-50"
          >
            <UpdateIcon size={16} />
            Update dostupný
          </Button>
        )}

        {/* Settings Menu */}
        <DropdownMenu open={Boolean(anchorEl)} onOpenChange={(open) => setAnchorEl(open ? document.body : null)}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <SettingsIcon size={16} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {isInstallable && (
              <DropdownMenuItem onClick={handleInstall}>
                <InstallIcon size={16} className="mr-2" />
                Nainštalovať aplikáciu
              </DropdownMenuItem>
            )}

            {isUpdateAvailable && (
              <DropdownMenuItem onClick={handleUpdate}>
                <UpdateIcon size={16} className="mr-2" />
                Aktualizovať aplikáciu
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={handleCheckUpdates}>
              <RefreshIcon size={16} className="mr-2" />
              Skontrolovať aktualizácie
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleClearCache}>
              <ClearCacheIcon size={16} className="mr-2" />
              Vymazať cache
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleShowInfo}>
              <InfoIcon size={16} className="mr-2" />
              Informácie o aplikácii
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <InfoIcon size={20} className="text-blue-600" />
              Informácie o BlackRent PWA
            </DialogTitle>
            <DialogDescription>
              Podrobné informácie o Progressive Web App funkcionalite
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                BlackRent je Progressive Web App (PWA) s pokročilými funkciami
              </AlertDescription>
            </Alert>

            <div>
              <Typography variant="subtitle2" className="font-semibold mb-2">
                Status aplikácie:
              </Typography>
              <div className="flex items-center gap-2 mb-2">
                {statusInfo.icon}
                <Typography variant="body2">
                  {statusInfo.description}
                </Typography>
              </div>
            </div>

            <div>
              <Typography variant="subtitle2" className="font-semibold mb-2">
                Sieťové pripojenie:
              </Typography>
              <div className="flex items-center gap-2 mb-2">
                {isOffline ? (
                  <OfflineIcon size={16} className="text-red-600" />
                ) : (
                  <OnlineIcon size={16} className="text-green-600" />
                )}
                <Typography variant="body2">
                  {isOffline
                    ? 'Offline režim'
                    : `Online - kvalita: ${networkQuality}`}
                </Typography>
              </div>
            </div>

            <div>
              <Typography variant="subtitle2" className="font-semibold mb-2">
                Verzia:
              </Typography>
              <Typography variant="body2" className="font-mono">
                {version || 'Načítavam...'}
              </Typography>
            </div>

            <div>
              <Typography variant="subtitle2" className="font-semibold mb-2">
                Funkcie:
              </Typography>
              <div className="pl-4 space-y-1">
                <Typography variant="body2">✅ Offline podpora</Typography>
                <Typography variant="body2">✅ Automatické cache</Typography>
                <Typography variant="body2">✅ Background sync</Typography>
                <Typography variant="body2">✅ Rýchle načítanie</Typography>
                {isInstalled && (
                  <Typography variant="body2">✅ Standalone režim</Typography>
                )}
              </div>
            </div>

            {isInstalled && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  🎉 Aplikácia je úspešne nainštalovaná a beží v standalone
                  režime!
                </AlertDescription>
              </Alert>
            )}

            {isInstallable && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  💡 Môžete si nainštalovať aplikáciu pre lepší zážitok
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Zavrieť
            </Button>
            {isInstallable && (
              <Button onClick={handleInstall}>
                <InstallIcon size={16} className="mr-2" />
                Nainštalovať
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PWAStatus;
