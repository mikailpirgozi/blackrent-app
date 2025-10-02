/**
 * 🍞 ERROR TOAST COMPONENT
 *
 * User-friendly error notifications:
 * - Network errors
 * - Retry indicators
 * - Connection status
 * - Auto-dismiss
 */

import {
  X as CloseIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  RotateCcw as RefreshIcon,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  Button,
  Progress,
  Badge,
  Typography,
} from '@/components/ui';
import React, { useState, useEffect } from 'react';

import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { EnhancedError } from '../../utils/errorHandling';

interface ErrorToastProps {
  error: EnhancedError | null;
  onClose: () => void;
  onRetry?: () => void;
  autoHideDuration?: number;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onClose,
  onRetry,
  // autoHideDuration = 6000,
}) => {
  const [open, setOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { isOnline, networkQuality } = useNetworkStatus();

  // Show toast when error appears
  useEffect(() => {
    if (error) {
      setOpen(true);
    }
  }, [error]);

  // Handle close
  const handleClose = () => {
    setOpen(false);
    window.setTimeout(onClose, 300); // Wait for animation
  };

  // Handle retry
  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
      setOpen(false);
      window.setTimeout(onClose, 300);
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  // Get alert classes based on error type
  const getAlertClasses = () => {
    if (!error) return 'bg-blue-900/50 border-blue-700';

    switch (error.errorType) {
      case 'connection':
        return 'bg-yellow-900/50 border-yellow-700';
      case 'server':
        return 'bg-red-900/50 border-red-700';
      case 'timeout':
        return 'bg-yellow-900/50 border-yellow-700';
      default:
        return 'bg-red-900/50 border-red-700';
    }
  };

  // Get connection icon
  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOffIcon size={16} />;

    switch (networkQuality) {
      case 'slow':
        return <WifiIcon size={16} className="text-orange-400" />;
      case 'medium':
        return <WifiIcon size={16} className="text-green-400" />;
      case 'fast':
        return <WifiIcon size={16} className="text-blue-400" />;
      default:
        return <WifiIcon size={16} />;
    }
  };

  if (!error) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <Alert className={`min-w-[300px] max-w-[500px] ${getAlertClasses()}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getConnectionIcon()}
          </div>
          <div className="flex-1">
            <AlertDescription className="text-white">
              {error.message}
            </AlertDescription>
            
            {/* Error details */}
            {error.technicalMessage && (
              <Typography variant="body2" className="text-white/80 mt-1 text-sm">
                {error.technicalMessage}
              </Typography>
            )}

            {/* Progress bar for retrying */}
            {isRetrying && (
              <Progress className="mt-2 h-1" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Connection status */}
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-white/30 text-xs"
            >
              {getConnectionIcon()}
              {isOnline ? networkQuality : 'offline'}
            </Badge>

            {/* Retry button */}
            {error.isRetryable && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying || !isOnline}
                className="text-white hover:bg-white/10"
              >
                <RefreshIcon 
                  size={16} 
                  className={isRetrying ? 'animate-spin' : ''}
                />
              </Button>
            )}

            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/10"
            >
              <CloseIcon size={16} />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
};
