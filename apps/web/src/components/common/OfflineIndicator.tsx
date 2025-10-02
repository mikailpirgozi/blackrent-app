// 📵 Offline Indicator Component
// Shows offline status with elegant animations and retry options

import {
  CloudOff as CloudOffIcon,
  ChevronUp as CollapseIcon,
  ChevronDown as ExpandIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  RefreshCw as RefreshIcon,
  Clock as ScheduleIcon,
  RotateCcw as SyncIcon,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Button,
} from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Typography,
} from '@/components/ui/typography';
import { useEffect, useState } from 'react';

import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { usePWA } from '../../hooks/usePWA';

// Global type definitions for browser APIs
declare global {
  interface _ServiceWorkerRegistration {
    sync?: {
      register: (_tag: string) => Promise<void>;
    };
  }
}

// interface OfflineIndicatorProps {
//   position?: 'top' | 'bottom';
//   showDetails?: boolean;
//   autoHide?: boolean;
//   hideDelay?: number;
// }

export const OfflineIndicator = ({
  position = 'top',
  showDetails = false,
  autoHide = false,
  hideDelay = 5000,
}) => {
  const { isOnline, networkQuality, wasOffline, reconnectedAt } =
    useNetworkStatus();
  const { isOffline: pwaOffline } = usePWA();

  const [showIndicator, setShowIndicator] = useState(!isOnline);
  const [expanded, setExpanded] = useState(false);
  const [pendingActions, setPendingActions] = useState<number>(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Show/hide indicator based on connection status
  useEffect(() => {
    if (!isOnline || pwaOffline) {
      setShowIndicator(true);
    } else if (autoHide && hideDelay > 0) {
      const timer = window.setTimeout(() => {
        setShowIndicator(false);
      }, hideDelay);
      return () => window.clearTimeout(timer);
    } else {
      setShowIndicator(false);
    }
    return undefined;
  }, [isOnline, pwaOffline, autoHide, hideDelay]);

  // Listen for service worker messages about pending actions
  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.serviceWorker) {
      const handleMessage = (event: any) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'PENDING_ACTIONS':
            setPendingActions(payload.count || 0);
            break;
          case 'SYNC_COMPLETE':
            setLastSync(new Date());
            setPendingActions(0);
            break;
        }
      };

      window.navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.serviceWorker) {
          window.navigator.serviceWorker.removeEventListener('message', handleMessage);
        }
      };
    }
    return undefined;
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      // Try to fetch a simple endpoint to test connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (response.ok) {
        // Connection restored, trigger sync if available
        if (typeof window !== 'undefined' && window.navigator && window.navigator.serviceWorker) {
          const registration = await window.navigator.serviceWorker.ready;
          // Background sync (if supported)
          if ('sync' in registration) {
            (registration as any).sync.register('blackrent-sync');
          }
        }
      }
    } catch (error) {
      console.log('Retry failed:', error);
    } finally {
      window.setTimeout(() => setIsRetrying(false), 1000);
    }
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (!showIndicator) {
    return null;
  }

  const isOffline = !isOnline || pwaOffline;
  const showReconnected = isOnline && wasOffline && reconnectedAt;

  return (
    <div className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50 p-2 transition-all duration-300 ${showIndicator ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <Card className={`mx-auto max-w-2xl overflow-hidden backdrop-blur-sm ${isOffline ? 'bg-red-600/90 border-red-700' : 'bg-green-600/90 border-green-700'}`}>
        <CardContent className="p-0">
          {/* Main Status Bar */}
          <div 
            className={`flex items-center justify-between p-4 ${showDetails ? 'cursor-pointer' : ''}`}
            onClick={showDetails ? handleToggleExpanded : undefined}
          >
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-white/20 ${isOffline ? 'animate-pulse' : ''}`}>
                {isOffline ? <OfflineIcon size={20} className="text-white" /> : <OnlineIcon size={20} className="text-white" />}
              </div>

              <div>
                <Typography variant="h6" className="font-semibold text-white">
                  {isOffline
                    ? 'Aplikácia je offline'
                    : showReconnected
                      ? 'Pripojenie obnovené!'
                      : 'Pripojené'}
                </Typography>

                <Typography variant="body2" className="text-white/90">
                  {isOffline
                    ? 'Niektoré funkcie sú obmedzené'
                    : `Kvalita siete: ${networkQuality}`}
                </Typography>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pendingActions > 0 && (
                <div className="flex items-center gap-1 bg-white/20 rounded px-2 py-1">
                  <ScheduleIcon size={16} className="text-white" />
                  <Typography variant="body2" className="text-white">
                    {pendingActions} čakajúcich
                  </Typography>
                </div>
              )}

              {isOffline && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="text-white hover:bg-white/20"
                >
                  <RefreshIcon 
                    size={16} 
                    className={isRetrying ? 'animate-spin' : ''} 
                  />
                </Button>
              )}

              {showDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleExpanded}
                  className="text-white hover:bg-white/20"
                >
                  {expanded ? <CollapseIcon size={16} /> : <ExpandIcon size={16} />}
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar for retrying */}
          {isRetrying && (
            <Progress className="h-1 bg-white/20" />
          )}

          {/* Expanded Details */}
          {showDetails && (
            <Collapsible open={expanded} onOpenChange={setExpanded}>
              <CollapsibleContent>
                <div className="border-t border-white/20 p-4 bg-black/10">
                  <div className="flex flex-wrap gap-4 mb-4">
                    {/* Network Status */}
                    <div className="bg-white/10 rounded p-3 flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <CloudOffIcon size={16} className="text-white" />
                        <Typography variant="subtitle2" className="text-white">Sieť</Typography>
                      </div>
                      <Typography variant="body2" className="text-white">
                        Status: {isOffline ? 'Offline' : 'Online'}
                      </Typography>
                      {!isOffline && (
                        <Typography variant="body2" className="text-white">
                          Kvalita: {networkQuality}
                        </Typography>
                      )}
                    </div>

                    {/* Pending Actions */}
                    <div className="bg-white/10 rounded p-3 flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <ScheduleIcon size={16} className="text-white" />
                        <Typography variant="subtitle2" className="text-white">Akcie</Typography>
                      </div>
                      <Typography variant="body2" className="text-white">
                        Čakajúce: {pendingActions}
                      </Typography>
                      {lastSync && (
                        <Typography variant="body2" className="text-white">
                          Posledný sync: {lastSync.toLocaleTimeString()}
                        </Typography>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="text-white border-white/50 hover:border-white hover:bg-white/10"
                    >
                      <RefreshIcon size={16} className="mr-2" />
                      {isRetrying ? 'Skúšam...' : 'Skúsiť znovu'}
                    </Button>

                    {pendingActions > 0 && isOnline && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (typeof window !== 'undefined' && window.navigator && window.navigator.serviceWorker) {
                            const registration =
                              await window.navigator.serviceWorker.ready;
                            // Background sync (if supported)
                            if ('sync' in registration) {
                              (registration as any).sync.register('blackrent-sync');
                            }
                          }
                        }}
                        className="text-white border-white/50 hover:border-white hover:bg-white/10"
                      >
                        <SyncIcon size={16} className="mr-2" />
                        Synchronizovať
                      </Button>
                    )}
                  </div>

                  <Alert className={`mt-4 ${isOffline ? 'bg-yellow-600/20 border-yellow-500' : 'bg-green-600/20 border-green-500'}`}>
                    <AlertDescription className="text-white">
                      {isOffline
                        ? 'Vaše akcie budú synchronizované po obnovení pripojenia.'
                        : 'Všetko funguje správne. Akcie sa synchronizujú automaticky.'}
                    </AlertDescription>
                  </Alert>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineIndicator;
